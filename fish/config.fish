set fish_greeting "hello"
. ~/.fishmarks/marks.fish

. /usr/local/share/chruby/chruby.fish
. /usr/local/share/chruby/auto.fish

chruby 2.1.2

# in ~/.config/fish/config.fish
# Load the default rubies
 
#if test -z $rvm_bin_path
  #exec bash --login -c "exec fish"
#end

set -x GOROOT /usr/lib/go1.4
set -x GOPATH $HOME/go
set -x PATH $GOROOT/bin $PATH

alias xc "xclip -sel clip"
