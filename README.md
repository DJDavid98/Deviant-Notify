<p align="center"><img src="https://raw.githubusercontent.com/DJDavid98/Deviant-Notify/master/screenshots/chrome/notification.png" alt="Deviant-Notify Chrome Notification Screenshot" width="300px"> <img src="https://raw.githubusercontent.com/DJDavid98/Deviant-Notify/master/screenshots/chrome/popup.png" alt="Deviant-Notify Chrome Popup Screenshot" width="300px"></p>
<h1 align="center"><img src="https://raw.githubusercontent.com/DJDavid98/Deviant-Notify/master/deviantnotify/img/app-48.png" alt="Deviant-Notify Extension Logo" height="30px"> Deviant-Notify</h1>

<p align="center">Keep track of your DeviantArt notifications and notes in (almost) real time</p>

<p align="center"><a href="https://chrome.google.com/webstore/detail/deviant-notify/hlmlndlfjhddkjdcmgjjmdefcplnekop"><img src="https://storage.googleapis.com/chrome-gcs-uploader.appspot.com/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/iNEddTyWiMfLSwFD6qGq.png" height="60" alt="Download Deviant-Notify from the Chrome Web Store"></a> <a href="https://addons.mozilla.org/en-US/firefox/addon/deviant-notify"><img src="https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_1.png" height="60" alt="Download Deviant-Notify from Firefox Add-ons"></a></p>

<p align="center"><img alt="Download Deviant-Notify from the Chrome Web Store" src="https://img.shields.io/chrome-web-store/v/hlmlndlfjhddkjdcmgjjmdefcplnekop"> <img alt="Download Deviant-Notify from Firefox Add-ons" src="https://img.shields.io/amo/v/Deviant-Notify"></p>

## Disclaimer

This is an **UNOFFICIAL** extension created by a regular user of the website, it is not endorsed nor maintained by DeviantArt.

## How does it work?

The extension sends specific API requests to the site every `N` minutes (which can be adjusted in the options) and aggregates the notification and note counts based on the response.

The total amount is then displayed on the icon, and when clicked it opens a menu that looks similar to the site's top bar with the notifications and notes icons, both of which can be clicked to go to their respective pages. You should choose the domain you're normally signed in on using the options, otherwise the extension can't keep count of your notifications and messages.

By default, the extension sends a notification and plays a sound when the total increases, but both the notification and its sound can be disabled if you only want the counter. The notification also disappears after a few seconds initially, but this can be changed to a longer duration or disabled entirely (by setting the timeout to 0), so only a click on the close button or one of the buttons will clear it.

### Why aren't some notifications and/or notes accounted for?

This extension is currently very basic compared to any previously existing ones and is limited in functionality. The counters only display the number of your own [unread notes](https://www.deviantart.com/notifications/notes/#unread_0), and all items in your [notifications feed](https://www.deviantart.com/notifications/feedback) (which have not been removed by pressing `X` on them). In the future I would like to introduce the ability to filter some types of messages from the notification count, as well as to include notifications for group messages, but for now I wanted to get something out the door ASAP. It is unlikely that I will be including any previews of the notification items themselves. The logic for detecting new items is also very basic for now, but I've already received suggestions on how it could be improved in the future.

## Submitting feedback

I'm soliciting user feedback through GitHub issues as well as through e-mail at inbox@djdavid98.art. If you have a feature request or want to ask for something that is not yet listed in this README feel free to reach out. I'll try to accommodate any requests that I believe I can feasibly maintain in the long term.

## Attributions

 - Notification sound: [notify.ogg](https://github.com/kav2k/dAnotifier/blob/master/src/audio/notify.ogg) from [kav2k/dAnotifier](https://github.com/kav2k/dAnotifier)
 - Message and bell icons are &copy; DeviantArt
 - Color picker: [Spectrum](https://bgrins.github.io/spectrum/)
