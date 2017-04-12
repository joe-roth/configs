Configuration for xmonad on gnome system (others will be similiar, but the config file will be different)

1. Install xmonad
sudo apt-get install xmonad

2.Update the configuration file
#ln -s /PATH/TO/xmonad/xmonad.hs ~/.xmonad
#xmonad --recompile

3. Tell gnome to use xmonad instead of metacity
#gconftool-2 -s /desktop/gnome/session/required_components/windowmanager xmonad --type string

4. Remap caps lock key to left-alt, so that it can be xmonad's action key
#ln -s /PATH/TO/configs/xmonad/.Xmodmap ~

NOTE: for linux guest within osx host, needed to follow this to map caps lock key to alt, and then was able to use caps lock as mod key
use PCKeyboardHack on mac

Use `xev` to test which keys are mapped to what.

To run: call `xmonad --replace & disown`
