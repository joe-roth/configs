import XMonad hiding ( (|||) )
import XMonad.Config.Gnome 
import XMonad.Util.EZConfig
import Data.Monoid
import XMonad.Util.Dmenu
import XMonad.Layout.LayoutCombinators
import XMonad.Config.Desktop
import XMonad.Prompt.Shell
import XMonad.Layout.ResizableTile


import qualified Data.Map        as M

myBorderWidth   = 0
myModMask       = mod3Mask

myLayout = desktopLayoutModifiers $ ResizableTall 1 (10/100) (1/2) [] ||| tiled ||| Mirror tiled ||| Full
  where
     -- default tiling algorithm partitions the screen into two panes
     tiled   = Tall nmaster delta ratio

     -- The default number of windows in the master pane
     nmaster = 1

     -- Default proportion of screen occupied by master pane
     ratio   = 1/2

     -- Percent of screen to increment by when resizing panes
     delta   = 1/100
 

main = xmonad $ gnomeConfig {
  modMask            = myModMask,
  layoutHook         = myLayout,
  borderWidth        = myBorderWidth 
}

                `additionalKeys`
                 [ ((myModMask, xK_f        ), spawn "firefox")
                 , ((myModMask, xK_c        ), spawn "chromium-browser")
                 , ((myModMask, xK_Return        ), spawn "gnome-terminal")
                 , ((myModMask, xK_a        ), sendMessage MirrorShrink )
                 , ((myModMask, xK_z        ), sendMessage MirrorExpand )
                 , ((myModMask, xK_t), sendMessage $ JumpToLayout "Full")   ]




