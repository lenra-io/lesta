# Lesta
The Lenra's static website framework. Look at the [framework section](#framework) to better understand how it works.

This framework fully configurable and let use your own server or even page renderer.
To understand how to configure your project, look at the [configuration section](#configure-lesta).

## Getting started

To create your first website follow the next steps:

```bash
# Install the depedency
npm i lenra-io/lesta
# create the view directory
mkdir -p src/views
# create your first view file
echo "html
  body
    h1 Hello world" > src/views/index.pug
```

Debug it with an Express server:

```bash
npx lesta express
```

Or generate it for an Nginx server:

```bash
npx lesta nginx
```

## Configure Lesta

Lesta is made to be fully configurable. To make it easier for the users, there are two configuration levels:

- [JSON configuration](#json-configuration)
- [JavaScript configuration](#javascript-configuration)

### JSON configuration

The JSON configuration let define many things, like the file paths.
It can be defined in a `lesta` property of your `package.json` file.
There is [default values](./config/default-config.json) for the configurations:

| Field            | Type             | Description                   |
|------------------|------------------|-------------------------------|
| `staticDir`      | String?          | The path of the static files directory |
| `i18nDir`        | String?          | `image` alias                 |
| `i18nDir`        | String?          | `image` alias                 |
| `i18nDir`        | String?          | `image` alias                 |
| `i18nDir`        | String?          | `image` alias                 |

### JavaScript configuration

## Framework

The framework is using many components to handle the generation of the websites.

### Website

It's the main element of the framework.
A Website needs a [Configuration](#json-configuration) and a [PathManager](#pathmanager) list.

To start or build a Website, just call the `generate` method with the desired Genetor.

### PathManager

A path manager is based on two methods:
- `getManagedPaths`: list all the paths managed by the PathManager
- `build`: builds the content of the given path

There is three built-in PathManagers:
- PageManager: handle pages. See the [dedicated section](#pagemanager) to learn more.
- RobotsManager: handle the search engines `robots.txt` files.
- SitemapManager: handle the search engines sitemap files.

#### PageManager

It handle the website pages for a given rendering techology.
A Website can have many PageManagers.

A page manager needs a `pageLister` function that lists the website pages and a `pageRenderer` function that renders the pages.

By default, the PageManager will handle `pug` files using the pugPageLister and pugPageRenderer.

### Generator

It's a function that will use the Configuration and the PathManagers to start or generate the Website.

Here are the built-in Generators:
- express: starts an Express server to serve the Website
- nginx: generates the website content and an Nginx configuration file.


## CLI

Lesta is usable through a command line interface.
You can pass it the [Generator](#generator) you want to use.


