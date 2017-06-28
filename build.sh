#!/bin/sh

usage() {
    printf "Usage: %s [ -u | -d ]\n" "$0" 1>&2
    printf "  -u   enable update\n" 1>&2
    printf "  -d   disable update\n" 1>&2
    exit 1
}

if [ $# = 0 ];then
    usage
fi

version=$(sed -n -e "s/.*<em:version>\(.*\)<\/em:version>/\1/p" install.rdf)
while getopts ":ud" OPTION
do
    case ${OPTION} in
        u) echo "update"  
	   cat defaults/preferences/update_enable.txt > defaults/preferences/update.js
 	   zip -r exchangecalendar-v"$version".xpi ./* -x \*.git \*.xpi \*.sh  update\*.txt
	   exit
	   ;;
        d) echo "no update" 
	   cat defaults/preferences/update_disable.txt > defaults/preferences/update.js
 	   zip -r exchangecalendar-v"$version".xpi ./* -x \*.git \*.xpi \*.sh  update\*.txt
	   exit
	   ;;
	*) usage ;; 
    esac
done 

usage
