'use strict';

/**
 * gh-index
 * An directory index for gh-pages.
 */

window.addEventListener('DOMContentLoaded', function () {
    var wrapper = document.getElementById('gh-index');

    function insertStylesheet(url) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
        document.head.appendChild(link);
    }

    function insertStylesheetAsync(url) {
        var raf = function () {
            return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };
        }();
        raf(function () {
            insertStylesheet(url);
        });
    }

    function insertScript(url) {
        var script = document.createElement('script');
        script.src = url;
        document.head.appendChild(script);
    }

    var index = {

        // RegExp for files to exclude
        excludes: new RegExp(wrapper.getAttribute('excludes')),

        /**
         * Init gh-index
         */
        init: function init() {
            window.addEventListener('hashchange', index.hashRoute);

            // insertStylesheet('http://amio.github.io/gh-index/index.css');
            insertStylesheet('index.css')
            //insertStylesheetAsync('https://octicons.github.com/components/octicons/octicons/octicons.css');
            insertStylesheetAsync('https://cdnjs.cloudflare.com/ajax/libs/octicons/3.5.0/octicons.min.css');
            window.fetch || insertScript('https://cdn.jsdelivr.net/fetch/0.9.0/fetch.min.js');

            index.loadTrees();
        },

        getRepoInfo: function getRepoInfo() {
            var config = wrapper.getAttribute('repo') || wrapper.getAttribute('data-repo');
            if (!config) return null;

            var repoInfo = config.split('/');
            return {
                owner: repoInfo[0],
                name: repoInfo[1],
                branch: 'gh-pages'
            };
        },

        loadTrees: function loadTrees() {
            var repo = index.getRepoInfo();
            if (!repo) return window.alert('Repo config missing!');

            var uri = 'https://api.github.com/repos/' + repo.owner + '/' + repo.name + ('/git/trees/' + repo.branch + '?recursive=1');
            window.fetch(uri, { cache: 'force-cache' }).then(function (resp) {
                return resp.json();
            }).then(function (result) {
                index.refresh(result.tree);
            });
        },

        /**
         * Everything after data loaded.
         * @param resp
         */
        refresh: function refresh(treeData) {
            // build tree
            index.tree = index.genTree(treeData);

            // build html
            index.hashRoute();
        },

        /**
         * Route task depends on current hash
         */
        hashRoute: function hashRoute() {
            var path = window.location.hash.substr(1).split('/');
            var sub = index.tree;

            while (sub && path.length && path[0]) {
                sub = sub[path.shift()];
            }

            index.updateIndexies(sub);
            removeAllSvg();
        },

        /**
         * Generate entire tree base on node list array return by Github API.
         * @param {Array} treeArr
         * @returns {Object}
         */
        genTree: function genTree(treeArr) {
            var root = {};
            for (var i = treeArr.length; i--;) {
                if (!this.excludes.test(treeArr[i].path)) {
                    this.addItem(root, treeArr[i]);
                }
            }

            return root;
        },

        /**
         * Add an item into tree.
         * @param tree
         * @param item
         * @returns {*}
         */
        addItem: function addItem(tree, item) {
            var parent = tree;
            item.path.replace(/[^/]+/g, function (seg, idx) {
                parent[seg] || (parent[seg] = {});
                parent = parent[seg];
                return idx;
            });

            parent['/NODE/'] = item;

            return item;
        },

        /**
         * Update list base on tree
         * @param tree
         */
        updateIndexies: function updateIndexies(tree) {
            // generate header html
            var path = window.location.hash.replace('#', '');
            var header = '<div class="header"><span>•_•</span></div>';
            var parentLink = '#' + path.replace(/[^/]+\/$/, '');
            if (path) {
                header = '<div class="header"><a class="uplink" href="' + parentLink + '">' + (path + '<span>←_←</span></a></div>');
            }

            // generate list html
            var repo = index.getRepoInfo();
            var home = 'http://' + repo.owner + '.github.io/' + repo.name + '/';
            var items = Object.keys(tree).map(function (key) {
                if (key === '/NODE/') return '';

                var node = tree[key]['/NODE/'];
                var str = '';
                switch (node.type) {
                    case 'blob':
                        str = '<li class="blob"><a class="lazy" href="' + (home + node.path) + '">' + ('<span class="octicon octicon-file-text"></span> ' + node.path + '</a></li>');
                        break;
                    case 'tree':
                        str = '<li class="tree"><a href="#' + node.path + '/">' + ('<span class="octicon octicon-file-directory"></span> ' + node.path + '/</a></li>');
                        break;
                }
                return str;
            }).join('');
            var list = '<ul>' + items + '</ul>';

            // Generate footer html
            var footer = '<div class="footer">' + '<a href="http://github.com/amio/gh-index">gh-index</a> ' + 'by <a href="http://github.com/amio">amio</a></div>';

            // insert html
            wrapper.innerHTML = header + list + footer;
        }
    };

    index.init();
});

document.addEventListener('DOMContentLoaded', function () {

    let active = false;

    const lazyLoad = function () {
        var lazyLinks = [].slice.call(document.querySelectorAll('a.lazy'));
        if (active === false) {
            active = true;
            setTimeout(function () {
                lazyLinks.forEach(function (lazyLinks) {
                    if ((lazyLinks.getBoundingClientRect().top <= window.innerHeight && lazyLinks.getBoundingClientRect().bottom >= 0) && getComputedStyle(lazyLinks).display !== "none") {
                        makeReportPreview(lazyLinks);
                        lazyLinks.classList.remove('lazy');

                        if (lazyLinks.length === 0) {
                            document.removeEventListener('scroll', lazyLoad);
                            window.removeEventListener('resize', lazyLoad);
                            window.removeEventListener('orientationchange', lazyLoad);
                        }
                    }
                });

                active = false;
            }, 200);
        }
    };

    document.addEventListener('scroll', lazyLoad);
    window.addEventListener('resize', lazyLoad);
    window.addEventListener('orientationchange', lazyLoad);
});


function makeReportPreview(linkObj) {
    var pageAddress = linkObj.getAttribute('href'); // linklerdeki adresleri al
    if (pageAddress != undefined) { // adres bilgisi boş değilse

        pageAddress = pageAddress.replace('http://ysdede.github.io/benchmarks/', ''); //cross origin kısıtlamasına takılmamak için kök adresi sil kendi siten içindeki dosyayı okuduğun anlaşılsın

        fetch(pageAddress)
            .then(response => response.text())
            .then(result => { // içerik çekme tamamlandığında
                let parser = new DOMParser();
                var doc = parser.parseFromString(result, 'text/html'); // içeriği html dom yapısına çevir

                if (doc.getElementById('left')) {
                    var getContent = doc.getElementById('left').firstElementChild.innerHTML; // çekilen sayfada left IS'si altındaki ilk divi içini al
                    getContent = '<a class="svg" href="' + pageAddress + '" target="_blank">' + getContent + '</a>'; // sayfadan çektiğin içeriğe sayfanın linkini ekle
                    var body = document.getElementsByTagName('BODY')[0];
                    linkObj.closest('li').insertAdjacentHTML('beforeend', getContent); // bulunduğun sayfanın gövdesinde sona bas
                    linkObj.style.display = 'none'; // linki gizle
                }
            });
    }
}

function removeAllSvg() {
    var svgs = document.querySelectorAll('.svg');
    for (let i = 0; i < svgs.length; i++) {
        svgs[i].remove();
    }
    window.scrollTo(window.scrollX, window.scrollY + 1);
}