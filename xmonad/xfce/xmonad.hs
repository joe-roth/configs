import XMonad hiding ( (|||) )
import XMonad.Config.Xfce
import XMonad.Util.EZConfig
import Data.Monoid
import XMonad.Util.Dmenu
import XMonad.Layout.LayoutCombinators
import XMonad.Config.Desktop
import XMonad.Prompt.Shell
import XMonad.Layout.ResizableTile
import XMonad.Hooks.SetWMName

import qualified Data.Map        as M

myBorderWidth	= 1
myModMask	= mod3Mask

myWorkspaces = ["main", "web", "chat"]

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
 
main = xmonad $ xfceConfig {
	borderWidth	= myBorderWidth,
  modMask		= myModMask,
  layoutHook  = myLayout,
  startupHook = setWMName "LG3D"
}
                `additionalKeys`
                 [ ((myModMask, xK_f        ), spawn "firefox")
                 , ((myModMask, xK_c        ), spawn "google-chrome --touch-devices=123")
                 , ((myModMask, xK_o        ), spawn "xfce4-appfinder")
                 , ((myModMask, xK_Return        ), spawn "exo-open --launch TerminalEmulator")
                 , ((myModMask, xK_a        ), sendMessage MirrorShrink )
                 , ((myModMask, xK_z        ), sendMessage MirrorExpand )
                 , ((myModMask, xK_t), sendMessage $ JumpToLayout "Full")] 
                 
