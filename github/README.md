To enable git pushes

ln -s /github/.netrc ~

change PASSWORD to git password

Add the following configs to the project
git config user.name joe-roth
git config user.email jtroth@gmail.com
git config core.editor "vim"

To set up remote repo:

On server:
    ssh joe@server.com
    mkdir folder
    cd folder
    git init --bare

On local:
    git clone joe@server.com:folder
    git remote add origin joe@server.com:folder


