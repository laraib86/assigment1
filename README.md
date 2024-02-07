# Server Setup

These are the steps for setting up a new production (or staging) server on an AWS instance.

## Overview

For the Django API, the server uses the following libraries to server the app:

- Postgresql 9.6
- Python 3 + `virtualenv` and `virtualenvwrapper`
- Supervisord (for managing the process)
- Gunicorn (the application server)
- Nginx (the proxy)

For the Ionic app, it's simply served directly using Nginx.

## Update OS

Update:

```sh
sudo apt-get update && sudo apt-get upgrade && sudo apt-get dselect-upgrade
```

## Install dependencies

```sh
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update && sudo apt-get upgrade && sudo apt-get dselect-upgrade
sudo apt-get install vim git nginx python3-setuptools python3-dev python3-pip postgresql-10 postgresql-client-10 postgis supervisor python-certbot-nginx zlib1g-dev libjpeg-dev postgresql-server-dev-10 redis
```
## Configure git

```sh
sudo git config --global user.name "Timmy O'Mahony"
sudo git config --global user.email "timmy@weareferal.com"
sudo git config --global core.editor "vim"
```

## Add SSH key

Once you have access to the new server (usually via username/password), you
need to add your own personal public key to the server so that you can access
it over SSH (in the next step, we'll disable password access)

*On your machine*, if you don't already have one, create a public/private key
pair and **make sure to use a passphase**

```sh
ssh-keygen -t rsa -b 4096
```

Copy the contents of the *public key*:

```sh
cat ~/.ssh/id_rsa.pub
```

*Back on the server*, add the public key to the `~/.ssh/authorized_keys` file:

```sh
vim ~/.ssh/authorized_keys
```

and update the permissiones

```sh
chmod 0600 ~/.ssh/authorized_keys
```

Make sure there aren't any spaces around the public key, or any blanks lines.

You should now be able to log out of the server, and log in again with you
key:

```sh
ssh -i ~/.ssh/id_rsa hey@timmyomahony.com
```

## Update SSH configuration

Restrict SSH login to public/private key only. Open the SSH config:

```sh
vim /etc/ssh/sshd_config
```

Uncomment:

```sh
AuthorizedKeysFile     %h/.ssh/authorized_keys
```

Change the default port:

```sh
Port 30000
```

Disable password login:

```sh
PasswordAuthentication no
```

Prevent root login:

```sh
PermitRootLogin no
```

Enable key login

```sh
PubkeyAuthentication yes
```

Restart SSH:

```sh
service ssh restart
```

## Add Github deployment key

To be able to get the codebase, we need to create a public/private key pair on
the server. **The private key should never leave the server, so make sure to
generate it on the server, not locally on your laptop**

```sh
ssh-keygen -t rsa -b 4096
```

Copy the contents of the *public key*:

```sh
cat ~/.ssh/id_rsa.pub
```

Now add a new "Deployment Key" via Github

- https://github.com/weareferal/find-hello-api/settings/keys

And paste in the public key for the server.

On the server, open/create the SSH config file:

```sh
vim ~/.ssh/config
```

and add the following:

```
Host github.com
    User git
    IdentityFile ~/.ssh/id_rsa
```

## Clone the repo

```sh
cd ~/
git clone git@github.com:weareferal/find-hello-api.git find_hello
cd find_hello
```

## Setup accounts

For deployment, you need accounts with:

- Sentry.io (for errors)
- Mailgun (for emails)

So make sure those are created and configured.

## Add environment variables

```sh
 cp env.example .env
```

```
GOOGLE_MAP_API_KEY=[...]
DATABASE_URL=postgresql://find_hello:[...]@localhost/find_hello
DJANGO_ADMIN_URL=admin-dashboard/
DJANGO_SETTINGS_MODULE=config.settings.production
DJANGO_SECRET_KEY=[...]
DJANGO_ALLOWED_HOSTS=findhello.therefugeecenter.org
DJANGO_MAILGUN_API_KEY=key-[...]
DJANGO_SERVER_EMAIL=noreply@therefugeecenter.org
MAILGUN_SENDER_DOMAIN=mg.therefugeecenter.org
DJANGO_SECURE_SSL_REDIRECT=False
DJANGO_SENTRY_DSN=[...]
DJANGO_SENTRY_PROJECT=[...]
DJANGO_SENTRY_ENVIRONMENT='staging'
HAYSTACK_URL=''
HAYSTACK_ADMIN_URL=''
```

## Create DB

```bash
sudo -u postgres psql
create database find_hello;
create user find_hello with password [PASSWORD];
grant all privileges on database find_hello to find_hello;
create extension postgis;
```

```
sudo vim /etc/postgresql/10/main/pg_hba.conf
```

and add to the bottom:

> local   find_hello      find_hello      password

and restart:

```sh
sudo /etc/init.d/postgresql restart
```

## Install virtualenv and virtualenvwrapper

```sh
sudo pip3 install virtualenv virtualenvwrapper
mkdir ~/.venvs
vim ~/.bashrc
```

and add:

```
export WORKON_HOME=~/.venvs
export VIRTUALENVWRAPPER_PYTHON=/usr/bin/python3
export VIRTUALENVWRAPPER_VIRTUALENV=/usr/local/bin/virtualenv
source /usr/local/bin/virtualenvwrapper.sh
```

## Create Virtualenv and install dependencies

```
mkvirtualenv find_hello  --python=python3
workon find_hello
add2virtualenv ./
pip install -r requirements/production.txt
```

```sh
workon find_hello
```

## Add GeoDjango data file

The app uses GeoDjango for some features, including IP geolocation. GeoDjango
requires the inclusion of a local data file to run.

Create a `geofiles` directory in the root of the repo (this will be ignored by
Github) and download the following:

http://geolite.maxmind.com/download/geoip/database/GeoLite2-City.tar.gz

Unzip the archive and place the `GeoLite2-City.mmdb` file in `geofiles`.

## Setup Django

```sh
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

## Create log files:

```sh
mkdir -p var/logs
touch /home/ubuntu/find-hello-api/var/logs/supervisor.out.log
touch /home/ubuntu/find-hello-api/var/logs/supervisor.err.log
touch /home/ubuntu/find-hello-api/var/logs/gunicorn.out.log
touch /home/ubuntu/find-hello-api/var/logs/gunicorn.err.log
touch /home/ubuntu/find-hello-api/var/logs/nginx.err.log
touch /home/ubuntu/find-hello-api/var/logs/nginx.out.log
```

## Setup Supervisor

We need a process manager to start/stop the app

First, make its possible to restart  the supervisor processes as a non-root user
by editing `/etc/supervisor/supervisor.conf` file and adding the following:

```
[unix_http_server]
file=/var/run/supervisord.sock
...
chown=admin:admin

...

[supervisorctl]
serverurl = unix:///var/run/supervisord.sock
```

Then make sure to create the socket file:

```
sudo touch /var/run/supervisord.sock
sudo chown admin:admin /var/run/supervisord.sock
```

Copy the config

```sh
sudo cp /home/ubuntu/find-hello-api/etc/supervisor.conf /etc/supervisor/conf.d/find_hello.conf
```

then start it

```sh
supervisorctl reread
```

```sh
supervisorctl update
```

and check the status

```sh
supervisorctl status
```

## Setup Nginx

Run `certbot` to generate a new SSL cert and default Nginx config

```sh
sudo certbot --nginx -d findhello.therefugeecenter.org
```

This will generate the file at `/etc/nginx/sites-enabled/default`.

Delete this and copy the example:

```sh
sudo cp etc/nginx.conf /etc/nginx/conf.d/find_hello.conf
