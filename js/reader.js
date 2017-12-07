(function() {
    'use strict';
    //本地存储

    var Util = (function() {
        var prefix = 'ficiton_reader_';
        //加前缀，防止被别数据覆盖
        var StorageGetter = function(key) {
            return localStorage.getItem(prefix + key);
        }
        var StorageSetter = function(key, val) {
            return localStorage.setItem(prefix + key, val);
        }
        //数据解密
        function getBSONP(url, callback) {
            return $.jsonp({
                url : url,
                cache : true,
                callback : "duokan_fiction_chapter",
                success : function(result) {
                    var data = $.base64.decode(result);
                    var json = decodeURIComponent(escape(data))
                    callback(json);
                }
            });

        };

        return {
            getBSONP : getBSONP,
            StorageGetter : StorageGetter,
            StorageSetter : StorageSetter
        }
    })();

    //todo 获得阅读器内容的方法，实现和阅读器相关的数据交互的方法
    function ReaderModel(id_, cid_, onChange_) {
        var Title = "";

        var Fiction_id = id_;

        var Chapter_id = cid_;

        if (Util.StorageGetter(Fiction_id + 'last_chapter')) {
            Chapter_id = Util.StorageGetter(Fiction_id + 'last_chapter');
        }
        //设置id默认值
        if (!Chapter_id) {
            Chapter_id = 1;
        }
        //章节目录存放
        var Chapters = [];

        var init = function() {
            getFictionInfoPromise.then(function(d) {
                gotoChapter(Chapter_id);
            });

        }
        var gotoChapter = function(chapter_id) {
            Chapter_id = chapter_id;
            getCurChapterContent();
        };

        //获得当前章节内容
        function getCurChapterContent() {
            $.get("data/data" + Chapter_id + ".json", function(data) {

                if (data.result == 0) {
                    var url = data.jsonp;
                    Util.getBSONP(url, function(data) {
                        $('#init_loading').hide();
                        Screen.scrollTop = 0;
                        window.scrollTo(0,0);
                        onChange_ && onChange_(data);
                    });
                } else {}
            }, 'json');
            return;

        };

        var getFictionInfoPromise = new Promise(function(resolve, reject) {
            $.get('data/chapter.json', function(data) {
                console.log(data);
                if (data.result == 0) {
                    Title = data.title;
                    window.ChaptersData = data.chapters;
                    window.chapter_data = data.chapters;
                    for (var i = 0; i < data.chapters.length; i++) {
                        Chapters.push({
                            "chapter_id" : data.chapters[i].chapter_id,
                            "title" : data.chapters[i].title
                        })
                    }
                    var RenderMenu=RenderCatalogue($('#catelog-container'));
                    RenderMenu(Chapters)
                    resolve(Chapters);
                } else {
                    reject(data);
                }
            }, 'json');

        });

        //获得上一章内容
        var prevChapter = function() {
            Chapter_id = parseInt(Chapter_id);
            if (Chapter_id == 0) {
                return
            }
            var cid = Chapter_id - 1;
            gotoChapter(cid);
            Util.StorageSetter(Fiction_id + 'last_chapter', Chapter_id);
        };

        //获得下一章内容
        var nextChapter = function() {
            Chapter_id = parseInt(Chapter_id);
            if (Chapter_id == Chapters.length - 1) {
                return
            }
            if(Chapter_id > 3)
            {
                alert('哈哈，我的小说已经写完了，如果你觉得好看，请关注微信806307567')
                Chapter_id=0
                return
            }

            var cid = Chapter_id + 1;

            gotoChapter(cid);
            Util.StorageSetter(Fiction_id + 'last_chapter', Chapter_id);
        };
        return {
            init : init,
            go : gotoChapter,
            prev : prevChapter,
            next : nextChapter,
            getChapter_id : function() {
                return Chapter_id;
            }
        };
    }

    //todo 渲染基本的UI结构
    function RenderCatalogue(catalogue) {
        function parseChapterCatalogue(jsonCatalogue) {
            let jsonObj =jsonCatalogue;
            let html = `<div class="catelog-info"><p class="chapter-num">共<span>${jsonObj.length}</span>章</p></div><ul class="catelog-list">`;
            for (let i = 0; i < jsonObj.length; i++) {
                html +=`<li><a href="###">${jsonObj[i].title}</a></li>`
            }
            html =`${html}</ul>`
            return html;
        }
        return function(data) {
            catalogue.html(parseChapterCatalogue(data));
        };
    }
    function RenderBaseFrame(container) {
        function parseChapterData(jsonData) {
            var jsonObj = JSON.parse(jsonData);
            var html = `<h4>${jsonObj.t}</h4>`;
            for (var i = 0; i < jsonObj.p.length; i++) {
                html += `<p> ${jsonObj.p[i]}</p>`;
            }
            return html;
        }


        return function(data) {
            container.html(parseChapterData(data));
        };
    }

    //todo 整个项目的入口函数
    function main() {
        // 绑定事件
        var ScrollLock = false;
        var Doc = document;
        var Screen = Doc.body;
        var Win = $(window);
        var inputRange=document.querySelector('.progInput')
        var RootContainer = $('#fiction_container');
        // 获取fiction_id 和 chapter_id

        var change = function($input) {
            Win.scrollY=($input.value/100)*(RootContainer.height()-screen.height)
            window.scrollTo(0,Win.scrollY);
        }

        $('.progInput').RangeSlider({ min: 0,   max: 100,  step: 0.1,  callback: change});

        //对屏幕的滚动监控
        Win.scroll(function() {
            inputRange.value=(this.scrollY/(RootContainer.height() - screen.height)) * 100;
            $('.progInput').css( 'background-size', inputRange.value + '% 100%' );
        });
        var Fiction_id, Chapter_id;

        //是否是夜间模式
        var NightMode = false;

        //初始化的字体大小
        var InitFontSize;

        //dom节点的缓存
        var Dom = {
            bottom_tool_bar : $('#bottom_tool_bar'),
            nav_title : $('#nav_title'),
            bk_container : $('#bk-container'),
            night_button : $('#night-button'),
            next_button : $('#next_button'),
            prev_button : $('#prev_button'),
            back_button : $('#back_button'),
            top_nav : $('#top-nav'),
            bottom_nav : $('.bottom_nav')
        }

        // 程序初始化
        var readerUIFrame = RenderBaseFrame(RootContainer);

        //获得章节数据，展示
        var readerModel = ReaderModel(Fiction_id || 13359, Chapter_id, function(data) {
            readerUIFrame(data);
            Dom.bottom_tool_bar.show();
            setTimeout(function() {
                ScrollLock = false;
                Screen.scrollTop = 0;
                $('.bookmark').removeClass('added')
                document.querySelector('.progInput').value=0
                $('.progInput').css( 'background-size', document.querySelector('.progInput').value + '% 100%' );
            }, 20);
        });

        //阅读器数据内容展示
        readerModel.init();

        //从缓存中读取的信息进行展示
        var ModuleFontSwitch = (function() {
            //字体和背景的颜色表
            var colorArr = [{
                value : '#ffffff',
                name : '默认',
                font : ''
            }, {
                value : '#c5dbb5',
                name : '护眼',
                font : '',
                id : "font_normal"
            }, {
                value : '#cef1fc',
                name : '清爽',
                font : ''
            }, {
                value : '#ffe2f0',
                name : '清新',
                font : ''
            }, {
                value : '#CDB38B',
                name : '复古',
                font : '#000000',
                bottomcolor : '#fff'
            }];

            var tool_bar = Util.StorageGetter('toolbar_background_color');
            var bottomcolor = Util.StorageGetter('bottom_color');
            var color = Util.StorageGetter('background_color');
            var font = Util.StorageGetter('font_color');
            var bkCurColor = Util.StorageGetter('background_color');
            var fontColor = Util.StorageGetter('font_color');

            for (var i = 0; i < colorArr.length; i++) {
                var display = 'none';
                if (bkCurColor == colorArr[i].value) {
                    display = '';
                }
                Dom.bk_container.append('<div class="bk-container" id="' + colorArr[i].id + '" data-font="' + colorArr[i].font + '"  data-bottomcolor="' + colorArr[i].bottomcolor + '" data-color="' + colorArr[i].value + '" style="background-color:' + colorArr[i].value + '">' + colorArr[i].name+'<div class="bk-container-current" style="display:' + display + '"></div></div>');
            }

            RootContainer.css('min-height', $(window).height() - 100);

            if (bottomcolor) {
                $('#bottom_tool_bar_ul').find('li').css('color', bottomcolor);
            }

            if (color) {
                $('body').css('background-color', color);
            }

            if (font) {
                $('.m-read-content').css('color', font);
            }

            //夜间模式
            if (fontColor == '#4e534f') {
                NightMode = true;
                $('#day_icon').show();
                $('#night_icon').hide();
                $('#bottom_tool_bar_ul').css('opacity', '0.6');
            }

            //字体设置信息
            InitFontSize = Util.StorageGetter('font_size');
            InitFontSize = parseInt(InitFontSize);

            if (!InitFontSize) {
                InitFontSize = 18;
            }

            RootContainer.css('font-size', InitFontSize);

        })();


        //页面中的零散交互事件处理
        var EventHandler = (function() {
            //夜间和白天模式的转化
            Dom.night_button.click(function() {
                if (NightMode) {
                    $('#day_icon').hide();
                    $('#night_icon').show();
                    $('#font_normal').trigger('click');
                    NightMode = false;
                    $('body').css('background-color', '#000000');
                    RootContainer.css('color', '#8f9294');
                } else {
                    $('#day_icon').show();
                    $('#night_icon').hide();
                    $('#font_night').trigger('click');
                    NightMode = true;
                    $('body').css('background-color', '#fff');
                    RootContainer.css('color', '#2b2b2b');
                }

            });

            //字体和背景颜色的信息设置
            Dom.bk_container.delegate('.bk-container', 'click', function() {
                var color = $(this).data('color');
                var font = $(this).data('font');
                var bottomcolor = $(this).data('bottomcolor');
                var tool_bar = font;
                Dom.bk_container.find('.bk-container-current').hide();
                $(this).find('.bk-container-current').show();
                if (!font) {
                    font = '#000';
                }
                if (!tool_bar) {
                    tool_bar = '#fbfcfc';
                }

                if (bottomcolor && bottomcolor != "undefined") {
                    $('#bottom_tool_bar_ul').find('li').css('color', bottomcolor);
                } else {
                    $('#bottom_tool_bar_ul').find('li').css('color', '#a9a9a9');
                }
                $('body').css('background-color', color);
                $('.m-read-content').css('color', font);

                Util.StorageSetter('toolbar_background_color', tool_bar);
                Util.StorageSetter('bottom_color', bottomcolor);
                Util.StorageSetter('background_color', color);
                Util.StorageSetter('font_color', font);

                var fontColor = Util.StorageGetter('font_color');
                //夜间模式
                if (fontColor == '#4e534f') {
                    NightMode = true;
                    $('#day_icon').show();
                    $('#night_icon').hide();
                    $('#bottom_tool_bar_ul').css('opacity', '0.6');
                } else {
                    NightMode = false;
                    $('#day_icon').hide();
                    $('#night_icon').show();
                    $('#bottom_tool_bar_ul').css('opacity', '0.9');
                }
            });

            //按钮的多态样式效果
            $('.spe-button').on('touchstart', function() {
                $(this).css('background', 'rgba(255,255,255,0.3)');
            }).on('touchmove', function() {
                $(this).css('background', 'none');
            }).on('touchend', function() {
                $(this).css('background', 'none');
            });

            //字体放大
            $('#large-font').click(function() {
                if (InitFontSize > 20) {
                    return;
                }
                InitFontSize += 1;
                Util.StorageSetter('font_size', InitFontSize);
                RootContainer.css('font-size', InitFontSize);
            });

            //字体缩小
            $('#small-font').click(function() {
                if (InitFontSize < 12) {
                    return;
                }
                InitFontSize -= 1;
                Util.StorageSetter('font_size', InitFontSize);
                RootContainer.css('font-size', InitFontSize);
            });

            var font_container = $('.font-container');
            var font_button = $('#font-button');
            var menu_container = $('#menu_container');
            var menu_nav = $('#menu-nav');

            font_button.click(function() {
                if (font_container.css('display') == 'none') {
                    font_container.show();
                    menu_nav.css('display','none');
                } else {
                }
            });

            RootContainer.click(function() {
                font_container.hide();
                font_button.removeClass('current');
            });


            //章节翻页
            Dom.next_button.click(function() {
                readerModel.next();
            });

            Dom.prev_button.click(function() {
                readerModel.prev();
            });

            //返回上级页面
            Dom.back_button.click(function() {
                if (Fiction_id) {
                    location.href = '/book/' + Fiction_id;
                }
            });

            //返回首页
            Dom.nav_title.click(function() {
                location.href = '/';
            });

            $('.icon-back').click(function() {
                location.href = '/';
            });
            //添加标签
            $('.bookmark').click(function() {
                $('.bookmark').hasClass('added')?$(this).removeClass('added'):$(this).addClass('added')
            });
            //目录弹出
            $('#menu_button').click(function() {
                $('#menu-nav').addClass('showCatelog')
            });
            //目录收回
            $('.catelog-bg').click(function() {
                $('#menu-nav').removeClass('showCatelog')
            });

            $('#catelog-menu').click(function () {
                $(this).addClass('active').siblings().removeClass('active')
                $('#catelog-container').css('display','none')
            })
            $('li#menu').click(function () {
                $(this).addClass('active').siblings().removeClass('active')
                $('#catelog-container').css('display','block')
            })

            //屏幕中央事件
            $('#action_mid').click(function() {
                $('#menu-nav').removeClass('showCatelog')
                if (Dom.top_nav.css('display') == 'none') {
                    Dom.bottom_nav.show();
                    Dom.top_nav.show();
                    $('.add-bookself').show()
                    $('.bookmark').show()
                } else {
                    Dom.bottom_nav.hide();
                    Dom.top_nav.hide();
                    font_container.hide();
                    $('.add-bookself').hide();
                    $('.bookmark').hide();
                    font_button.removeClass('current');
                }

            });
        })();
    }

    return main();
})();