<p align="center"><img src="https://raw.githubusercontent.com/DJDavid98/Deviant-Notify/master/screenshots/chrome/notification.png" alt="Deviant-Notify Chrome Notification Screenshot" width="300px"> <img src="https://raw.githubusercontent.com/DJDavid98/Deviant-Notify/master/screenshots/chrome/popup.png" alt="Deviant-Notify Chrome Popup Screenshot" width="300px"></p>
<h1 align="center"><img src="https://raw.githubusercontent.com/DJDavid98/Deviant-Notify/master/deviantnotify/img/app-48.png" alt="Deviant-Notify Extension Logo" height="30px"> Deviant-Notify</h1>

<p align="center">Keep track of your DeviantArt notifications and notes in (almost) real time</p>

<p align="center"><a href="https://chrome.google.com/webstore/detail/deviant-notify/hlmlndlfjhddkjdcmgjjmdefcplnekop"><img src="https://storage.googleapis.com/chrome-gcs-uploader.appspot.com/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/iNEddTyWiMfLSwFD6qGq.png" height="60" alt="Download Deviant-Notify from the Chrome Web Store"></a> <a href="https://addons.mozilla.org/en-US/firefox/addon/deviant-notify"><img src="https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_1.png" height="60" alt="Download Deviant-Notify from Firefox Add-ons"></a></p>

<p align="center"><img alt="Download Deviant-Notify from the Chrome Web Store" src="https://img.shields.io/chrome-web-store/v/hlmlndlfjhddkjdcmgjjmdefcplnekop"> <img alt="Download Deviant-Notify from Firefox Add-ons" src="https://img.shields.io/amo/v/Deviant-Notify"></p>

## Disclaimer

This is an **UNOFFICIAL** extension created by a regular user of the website, it is not endorsed nor maintained by DeviantArt.

## How does it work?

The extension sends specific API requests to the site every `N` minutes (which can be adjusted in the options) and aggregates the notification and note counts based on the response.

The total amount is then displayed on the icon, and when clicked it opens a menu that looks similar to the site's top bar with the chat, notifications and watch icons, all of which can be clicked to go to their respective pages.

By default, the extension sends a notification and plays a sound when the total increases, but both the notification and its sound can be disabled if you only want the counter. The notification also disappears after a couple seconds initially, but this can be changed to a longer duration or disabled entirely (by setting the timeout to 0), so only a click on the close button or one of the buttons will clear it.

### What is counted as a notification exactly?

The counter displays an aggregated total of:

* your own [unread notes]
* the total number of unread items in your [watch feed] (can filtered by type)
* all unread items in your [notifications feed] (can be filtered by type)

The word "unread" refers to a type/category of notifications which have not been marked read yet via a dedicated button in the extension popup. The time when that button was pressed is stored in the browser, and you will not get another notification for that type until you receive a newer item. The badge on the extension icon will also only show an aggregate of unread items.

Additionally, there are links to mark all current notifications as read and to reset the read state (so all notification will show as unread) in the extension popup.

## Submitting feedback

I'm soliciting user feedback through GitHub issues as well as through e-mail at inbox@djdavid98.art. If you have a feature request or want to ask for something that is not yet listed in this README feel free to reach out. I'll try to accommodate any requests that I believe I can feasibly maintain in the long term.

## Build instructions

1. Install the latest version of Node.js and NPM for your platform
2. Execute `npm ci --verbose` in the root directory<br>
   Please note that on systems with a slow Internet connection or in virtualized environments this step may take a long time (multiple minutes) and it might even appear to freeze at times.
   The `--verbose` flag instructs the CLI to display additional log information and causes messages in the console to persist making diagnosing issues easier.
3. Execute `npm run postintall` in the root directory
4. Execute `npm run build` in the root directory<br>
   If this step gives you an error message, please read everything below.

After this, the contents of the `deviantnotify` folder is the build output. Additionally, an attempt is made to create a zip file in the root folder named `deviantnotify.zip`, which gets uploaded to the extension hosting sites.

Sometimes `node-7z-archive` can fail to install binaries, in which case the build command will appear to fail with an error similar to this:

> Creating/adding...
> CreateArchive failed using `7z`, retying with `7za`.
> --- error:
> Error: spawn (???)\node_modules\node-7z-archive\binaries\win32\7za.exe ENOENT

or this:

> Creating/adding...
> CreateArchive failed using `7z`, retying with `7za`.
> --- error:
> Error: spawn (???)/node_modules/node-7z-archive/binaries/linux/7za EACCES


In this case the **build actually succeeded**, and only the final zipping step failed. This is a known issue with the zipping package, and there isn't a simple fix from what I've found.

You can simply **use the contents of the `deviantnotify` folder** and/or zip it manually using your favourite tool.

### Explanation

The extension's source is written in [TypeScript] which needs to be translated to regular old JavaScript so that the browser can actually run it. For a one-time build, simply install the dependencies using `npm ci` then execute `npm run build` which will compile all `.ts` files to plain `.js` files under the `deviantnotify/js` directory, as well as create a zip archive containing the extension code.

The files generated by this script are tied to the source files, so they are in the repository's `.gitignore` to prevent them from being committed.

### Local development

If you are developing locally then you should run the `npm run watch` script, which is going to watch for changes in the filesystem and automatically re-compiles modified script files.

## Attributions

- Notification sound: [notify.ogg] from [kav2k/dAnotifier]
- Message, bell and eye icons are &copy; DeviantArt

[unread notes]: https://www.deviantart.com/notifications/notes/#unread_0

[watch feed]: https://www.deviantart.com/notifications/watch

[notifications feed]: https://www.deviantart.com/notifications/feedback

[notify.ogg]: https://github.com/kav2k/dAnotifier/blob/master/src/audio/notify.ogg

[kav2k/dAnotifier]: https://github.com/kav2k/dAnotifier

[Spectrum]: https://bgrins.github.io/spectrum/

[TypeScript]: https://www.typescriptlang.org/
