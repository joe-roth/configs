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

