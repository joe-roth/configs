setlocal makeprg=jslint\ %
setlocal efm=%-P%f,
                    \%E%>\ #%n\ %m,%Z%.%#Line\ %l\\,\ Pos\ %c,
                    \%-G%f\ is\ OK.,%-Q
