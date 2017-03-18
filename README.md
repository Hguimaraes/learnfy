<p align="center">
<img src="public/imgs/learnfy_logo.png">
</p>

## learnfy

> Create a music genre dataset (metadata or audio) for classification using the Spotify Web API.

*Disclaimer: It's not a Spotify product and isn't associated with the company.*

### Intro

Learnfy is a webapp to help you to create a dataset of songs for music genre classification. 

### Resources

### Setting up

#### Clone the repo

```bash
$ git clone https://github.com/Hguimaraes/learnfy
$ cd learnfy
$ npm install && bower install
```

#### Create your app on the Spotify developer page

*@TO-DO*

#### Create the env file

```bash
$ mv .env.example .env
```

And edit the .env file with your favorite text editor and place your client ID and client secret in the correct line (without "").

#### Change the config file (optional)

You can edit the *config/config.js* file to change the place where you will save the data. By default it will save on the *dataset* folder.

#### Run the app

```bash
$ node learnfy
```

or if you already have an bkp file and want to create an exact dataset of it:

```bash
$ node learnfy --restore mybkpfile.bkp
```

Where *mybkpfile.bkp* is the path to your backup file.

### Contributing

### Legal information

### Demos
