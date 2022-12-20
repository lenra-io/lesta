<div id="top"></div>
<!--
*** This README was created with https://github.com/othneildrew/Best-README-Template
-->



<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">

<h3 align="center">Lesta</h3>

  <p align="center">
    The Lenra's static website framework.
    <br />
    <br />
    <a href="https://github.com/lenra-io/lesta/issues">Report Bug</a>
    ·
    <a href="https://github.com/lenra-io/lesta/issues">Request Feature</a>
  </p>
</div>


This framework is fully configurable and let you use your own server or even page renderer.
To understand how to configure your project, look at the [configuration section](#configure-lesta).

Look at the [framework section](#framework) to better understand how it works.

## Getting started

To create your first website follow the next steps:

```bash
# Install the dependency
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

<p align="right">(<a href="#top">back to top</a>)</p>

## Configure Lesta

Lesta is made to be fully configurable. To make it easier for the users, there are two configuration levels:

- [JSON configuration](#json-configuration)
- [JavaScript configuration](#javascript-configuration)

### JSON configuration

The JSON configuration allows you to define many things, like the file paths.
It can be defined in a `lesta` property of your `package.json` file.
There is [default values](./config/default-config.json) for the configurations:

| Field            | Type             | Description                   |
|------------------|------------------|-------------------------------|
| `staticDir`      | string           | The static files base directory |
| `i18nDir`        | string           | The internationalisation files base directory |
| `viewsDir`       | string           | The view files base directory |
| `buildDir`       | string           | The build target directory    |
| `languages`      | string[]         | The list of managed languages by priority |
| `enableDefaultLanquage` | boolean   | Define if the first language is the default |
| `translationStrategy` | string?     | Define the strategy to manage page translation |
| `port`           | integer          | The listened server port      |
| `robots`         | RobotsConfiguration | The robots.txt manager configuration |
| `nginx`          | NginxConfiguration | The nginx generator configuration |

Many other configuration keys can be defined to manage new components configurations.

### JavaScript configuration

Lesta can also handle new elements by defining a Lesta configurator in the `lesta.config.js` file at the base of the project.
The elements defined in this file would override the [default configurators](./config/configurator.js) ones (except for the generators map which is merged).

Here are the overridable elements:

- `getManagers`: returns the website [PathManagers](#pathmanager)
- `generators`: the generators map. The keys of this map are the allowed values by the [Lesta CLI](#cli).
- `getConfiguration`: returns the website [Configuration](#json-configuration)

<p align="right">(<a href="#top">back to top</a>)</p>

## Framework

The framework is using many components to handle the generation of the websites.

### Website

It's the main element of the framework.
A Website needs a [Configuration](#json-configuration) and a [PathManager](#pathmanager) list.

To start or build a Website, just call the `generate` method with the desired Generator.

### PathManager

A path manager is based on two methods:
- `getManagedPaths`: list all the paths managed by the PathManager
- `build`: builds the content of the given path

There is three built-in PathManagers:
- PageManager: handles pages. See the [dedicated section](#pagemanager) to learn more.
- RobotsManager: handles the search engines `robots.txt` files.
- SitemapManager: handles the search engines sitemap files.

#### PageManager

It handles the website pages for a given rendering technology.
A Website can have many PageManagers.

A page manager needs a `pageLister` function that lists the website pages and a `pageRenderer` function that renders the pages.

By default, the PageManager will handle `pug` files using the pugPageLister and pugPageRenderer.

### Generator

It is a function that will use the Configuration and the PathManagers to start or generate the Website.

Here are the built-in Generators:
- express: starts an Express server to serve the Website
- nginx: generates the website content and an Nginx configuration file.

<p align="right">(<a href="#top">back to top</a>)</p>


## CLI

Lesta is usable through a command line interface.
You can pass it the [Generator](#generator) you want to use.

<p align="right">(<a href="#top">back to top</a>)</p>




<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please open an issue with the tag "enhancement".
Don't forget to give the project a star if you liked it! Thanks again!

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the **MIT** License. See [LICENSE](./LICENSE) for more information.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Lenra - [@lenra_dev](https://twitter.com/lenra_dev) - contact@lenra.io

Project Link: [https://github.com/lenra-io/lesta](https://github.com/lenra-io/lesta)

<p align="right">(<a href="#top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/lenra-io/lesta.svg?style=for-the-badge
[contributors-url]: https://github.com/lenra-io/lesta/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/lenra-io/lesta.svg?style=for-the-badge
[forks-url]: https://github.com/lenra-io/lesta/network/members
[stars-shield]: https://img.shields.io/github/stars/lenra-io/lesta.svg?style=for-the-badge
[stars-url]: https://github.com/lenra-io/lesta/stargazers
[issues-shield]: https://img.shields.io/github/issues/lenra-io/lesta.svg?style=for-the-badge
[issues-url]: https://github.com/lenra-io/lesta/issues
[license-shield]: https://img.shields.io/github/license/lenra-io/lesta.svg?style=for-the-badge
[license-url]: https://github.com/lenra-io/lesta/blob/master/LICENSE
