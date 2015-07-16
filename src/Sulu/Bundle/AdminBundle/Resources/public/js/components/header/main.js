/*
 * This file is part of the Sulu CMF.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 *
 */

/**
 * @class Header
 * @constructor
 *
 * @param {Object} [options] Configuration object
 * @param {String|Array} [options.toolbarTemplate] Template of items for the toolbar. Can be Object with valid structure (see husky) or a string representing an object with items (e.g. 'default')
 * @param {String|Array} [options.toolbarParentTemplate] same as toolbarTemplate. Gets merged with toolbarTemplate
 * @param {String} [options.instanceName] name of the instance
 * @param {Function} [options.changeStateCallback] Function to execute if the toolbar-state changes
 * @param {Function} [options.parentChangeStateCallback] Same as changeStateCallback
 * @param {Object} [options.tabsData] data to pass to the tabs component. For data-structure markup see husky
 * @param {Object} [options.contentComponentOptions] options to forward to the content-component. Are further used for the content-tabs-component
 * @param {Object} [options.contentEl] element for the content-component
 * @param {Object} [options.toolbarOptions] options to pass to the toolbar-component
 * @param {Boolean|Object} [options.toolbarLanguageChanger] If true a default-language changer will be displayed. Can be an object to build a custom language changer
 * @param {String} [options.toolbarLanguageChanger.url] url to fetch the dropdown-data from
 * @param {Function} [options.toolbarLanguageChanger.callback] callback to pass the clicked language-item to
 * @param {String} [options.toolbarLanguageChanger.preselected] id of the language selected at the beginning
 * @param {Object} [options.tabsOptions] options to pass to the tabs-component. For valid data-structure see husky
 * @param {Boolean} [options.tabsFullControl] If true the content-component won't be initialized. Allowes you to fully take over the handling of the tab events
 * @param {Boolean} [options.toolbarDisabled] if true the toolbar-component won't be initialized
 * @param {Boolean} [options.noBack] if true the back icon won't be displayed
 */

define([], function () {

    'use strict';

    var defaults = {
            toolbarTemplate: 'default',
            toolbarParentTemplate: null,
            instanceName: '',
            changeStateCallback: null,
            parentChangeStateCallback: null,
            tabsData: null,
            contentComponentOptions: {},
            contentEl: null,
            toolbarOptions: {},
            toolbarLanguageChanger: true,
            tabsOptions: {},
            tabsFullControl: false,
            toolbarDisabled: false,
            noBack: false
        },

        constants = {
            componentClass: 'sulu-header',
            headerBackgroundSelector: '.sulu-header-background',
            hasTabsClass: 'has-tabs',
            backClass: 'back',
            backIcon: 'chevron-left',
            toolbarClass: 'toolbar',
            tabsClass: 'tabs',
            innerSelector: '.inner',
            tabsSelector: '.tabs-container',
            toolbarDefaults: {
                groups: [
                    {id: 'left', align: 'left'},
                    {id: 'right', align: 'right'}
                ]
            },
            languageChangerDefaults: {
                id: 'language',
                group: 'right',
                position: 10,
                title: '',
                class: 'highlight-white',
                dropdownOptions: {
                    changeButton: true
                }
            }
        },

        templates = {
            toolbarRow: [
                '<div class="toolbar-row">',
                '   <div class="left-container ' + constants.backClass + '">',
                '       <span class="fa-' + constants.backIcon + '"></span>',
                '   </div>',
                '   <div class="toolbar-container">',
                '       <div class="' + constants.toolbarClass + '"></div>',
                '   </div>',
                '   <div class="right-container">',
                '   </div>',
                '</div>'
            ].join(''),
            tabsRow: [
                '<div class="tabs-row">',
                '    <div class="' + constants.tabsClass + '"></div>',
                '</div>'
            ].join('')
        },

        createEventName = function (postfix) {
            return 'sulu.header.' + ((!!this.options.instanceName) ? this.options.instanceName + '.' : '') + postfix;
        },

        /**
         * trigger after initialization has finished
         *
         * @event sulu.header.[INSTANCE_NAME].initialized
         */
        INITIALIZED = function () {
            return createEventName.call(this, 'initialized');
        },

        /**
         * listens on and hides the header
         *
         * @event sulu.header.[INSTANCE_NAME].hide
         */
        HIDE = function () {
            return createEventName.call(this, 'hide');
        },

        /**
         * emitted when the back-icon gets clicked
         *
         * @event sulu.header.[INSTANCE_NAME].back
         */
        BACK = function () {
            return createEventName.call(this, 'back');
        },

        /**
         * listens on changes of the header
         * @event sulu.header.[INSTANCE_NAME].change
         */
        CHANGE = function () {
            return createEventName.call(this, 'change');
        },

        /**
         * listens on and changes the state of the toolbar
         *
         * @event sulu.header.[INSTANCE_NAME].toolbar.state.change
         * @param {string} type 'add' or 'edit'
         * @param {boolean} saved If false toolbar gets set in dirty state
         * @param {boolean} highlight True to change with highlight effect
         */
        TOOLBAR_STATE_CHANGE = function () {
            return createEventName.call(this, 'toolbar.state.change');
        },

        /**
         * listens on and passes the outer height of the components element to a callback
         *
         * @event sulu.header.[INSTANCE_NAME].get-height
         * @param {function} callback to pass the outer-height to
         */
        GET_HEIGHT = function () {
            return createEventName.call(this, 'get-height');
        },

        /**
         * listens on and initializes a blank toolbar with given options
         *
         * @event sulu.header.[INSTANCE_NAME].set-toolbar
         * @param {object} The options to pass to the toolbar-component
         */
        SET_TOOLBAR = function () {
            return createEventName.call(this, 'set-toolbar');
        },

        /**
         * emited if the language changer got changed
         *
         * @event sulu.header.[INSTANCE_NAME].language-changed
         * @param {string} the language which got changed to
         */
        LANGUAGE_CHANGED = function () {
            return createEventName.call(this, 'language-changed');
        },

    /*********************************************
     *   Abstract events
     ********************************************/

        /**
         * listens on activates tabs
         *
         * @event sulu.header.[INSTANCE_NAME].tabs.activate
         */
        TABS_ACTIVATE = function () {
            return createEventName.call(this, 'tabs.activate');
        },

        /**
         * listens on deactivates tabs
         *
         * @event sulu.header.[INSTANCE_NAME].tabs.activate
         */
        TABS_DEACTIVATE = function () {
            return createEventName.call(this, 'tabs.deactivate');
        },

        /**
         * listens on and sets a button
         *
         * @event sulu.header.[INSTANCE_NAME].toolbar.button.set
         * @param {string} id The id of the button
         * @param {object} object with a icon and title
         */
        TOOLBAR_BUTTON_SET = function () {
            return createEventName.call(this, 'toolbar.button.set');
        },

        /**
         * listens on and sets an item in loading state
         *
         * @event sulu.header.[INSTANCE_NAME].toolbar.item.loading
         * @param {string} id The id of the item
         */
        TOOLBAR_ITEM_LOADING = function () {
            return createEventName.call(this, 'toolbar.item.loading');
        },

        /**
         * listens on and changes the item of a button
         *
         * @event sulu.header.[INSTANCE_NAME].toolbar.item.change
         * @param {string} button The id of the button
         * @param {string} item the id or the index of the dropdown-item
         */
        TOOLBAR_ITEM_CHANGE = function () {
            return createEventName.call(this, 'toolbar.item.change');
        },

        /**
         * listens on and marks a subitem
         *
         * @event sulu.header.[INSTANCE_NAME].toolbar.item.mark
         * @param {string} item The id of the subitem
         */
        TOOLBAR_ITEM_MARK = function () {
            return createEventName.call(this, 'toolbar.item.mark');
        },

        /**
         * listens on and shows a button
         *
         * @event sulu.header.[INSTANCE_NAME].toolbar.item.show
         * @param {string} button The id of the button
         */
        TOOLBAR_ITEM_SHOW = function () {
            return createEventName.call(this, 'toolbar.item.show');
        },

        /**
         * listens on and enables a button
         *
         * @event sulu.header.[INSTANCE_NAME].toolbar.item.enable
         * @param {string} button The id of the button
         */
        TOOLBAR_ITEM_ENABLE = function () {
            return createEventName.call(this, 'toolbar.item.enable');
        },

        /**
         * listens on and shows back icon
         *
         * @event sulu.header.[INSTANCE_NAME].toolbar.items.set
         * @param id {string|number} id of the parent item
         * @param items {array} array of items to set
         */
        TOOLBAR_ITEMS_SET = function () {
            return createEventName.call(this, 'toolbar.items.set');
        },

        /**
         * Predefined toolbar templates
         * each function must return a an array with items for the toolbar
         * @type {{default: function, languageChanger: function, defaultLanguageChanger: function}}
         */
        toolbarTemplates = {
            default: function () {
                return[
                    {
                        id: 'save-button',
                        icon: 'floppy-o',
                        position: 1,
                        group: 'left',
                        disabled: true,
                        callback: function () {
                            this.sandbox.emit('sulu.header.toolbar.save');
                        }.bind(this)
                    },
                    {
                        icon: 'gear',
                        group: 'left',
                        id: 'options-button',
                        position: 30,
                        dropdownItems: [
                            {
                                id: "delete-button",
                                title: this.sandbox.translate('toolbar.delete'),
                                callback: function () {
                                    this.sandbox.emit('sulu.header.toolbar.delete');
                                }.bind(this)
                            }
                        ]
                    }
                ];
            },

            empty: function() {
                return [];
            },

            save: function () {
                return [toolbarTemplates.default.call(this)[0]];
            },

            languageChanger: function(url, callback, resultKey, titleAttribute) {
                var button;

                // default callback for language dropdown
                if (typeof callback !== 'function') {
                    callback = function (item) {
                        this.sandbox.emit('sulu.header.toolbar.language-changed', item);
                    }.bind(this);
                }

                button = this.sandbox.util.extend(true, {}, constants.languageChangerDefaults, {
                    hidden: true,
                    dropdownOptions: {
                        url: url,
                        resultKey: resultKey,
                        titleAttribute: titleAttribute || 'name',
                        idAttribute: 'localization',
                        markSelected: true,
                        callback: callback
                    }
                });

                return [button];
            },

            languageChangerData: function(data, callback) {
                // default callback for language dropdown
                if (typeof callback !== 'function') {
                    callback = function(item) {
                        this.sandbox.emit('sulu.header.toolbar.language-changed', item);
                    }.bind(this);
                }

                var button = this.sandbox.util.extend(true, {}, constants.languageChangerDefaults, {
                    id: 'language',
                    title: this.options.toolbarLanguageChanger.preSelected || this.sandbox.sulu.user.locale,
                    dropdownItems: data,
                    dropdownOptions: {
                        markSelected: true,
                        callback: callback
                    }
                });

                return [button];
            },

            defaultLanguageChanger: function() {
                var button, items = [], i, length;

                // generate dropdown-items
                for (i = -1, length = this.sandbox.sulu.locales.length; ++i < length;) {
                    items.push({
                        title: this.sandbox.sulu.locales[i],
                        locale: this.sandbox.sulu.locales[i]
                    });
                }

                button = this.sandbox.util.extend(true, {}, constants.languageChangerDefaults, {
                    id: 'language',
                    title: this.options.toolbarLanguageChanger.preSelected || this.sandbox.sulu.user.locale,
                    dropdownItems: items,
                    dropdownOptions: {
                        markSelected: true,
                        callback: function(item) {
                            this.sandbox.emit(LANGUAGE_CHANGED.call(this), item.locale);
                        }.bind(this)
                    }
                });

                return [button];
            }
        },

        changeStateCallbacks = {
            default: function (saved, type, highlight) {
                if (!!saved) {
                    this.sandbox.emit(
                        'husky.toolbar.' + this.toolbarInstanceName + '.item.disable', 'save-button',
                        !!highlight
                    );
                } else {
                    this.sandbox.emit(
                        'husky.toolbar.' + this.toolbarInstanceName + '.item.enable',
                        'save-button',
                        false
                    );
                }
            }
        },

        /**
         * Returns a template useable by the toolbar-component
         * @param {Object|String} template Can be a JSON-string, String representing a function
         *                        in toolbarTemplates or a valid array of objects
         * @returns {Object} a template usable by the toolbar-component
         */
        getToolbarTemplate = function (template) {
            var templateObj = template;
            if (typeof template === 'string') {
                try {
                    templateObj = JSON.parse(template);
                } catch (e) {
                    if (!!toolbarTemplates[template]) {
                        templateObj = toolbarTemplates[template].call(this);
                    } else {
                        this.sandbox.logger.log('no template found!');
                    }
                }
            } else if (typeof templateObj === 'function') {
                templateObj = template();
            }
            return templateObj;
        },

        /**
         * Looks in changeStateCallbacks for a function and returns it
         * @param {String} template String representing a function in changeStateCallbacks
         * @returns {Function} the matched function
         */
        getChangeToolbarStateCallback = function (template) {
            if (!!changeStateCallbacks[template]) {
                return changeStateCallbacks[template];
            } else {
                this.sandbox.logger.log('no template found!');
            }
        };

    return {
        /**
         * Initializes the component
         */
        initialize: function () {
            this.options = this.sandbox.util.extend(true, {}, defaults, this.options);

            this.sandbox.dom.append(this.$el, this.sandbox.util.template(templates.toolbarRow)());
            this.sandbox.dom.append(this.$el, this.sandbox.util.template(templates.tabsRow)());

            // store the instance-name of the toolbar
            this.toolbarInstanceName = 'header' + this.options.instanceName;

            this.bindCustomEvents();
            this.bindDomEvents();
        },

        /**
         * Renders the component
         */
        render: function () {
            // add component-class
            this.sandbox.dom.addClass(this.$el, constants.componentClass);

            // hide back if configured
            if (this.options.noBack === true) {
                this.sandbox.dom.hide(this.$find('.' + constants.backClass));
            } else {
                this.sandbox.dom.show(this.$find('.' + constants.backClass));
            }
        },

        /**
         * Builds the template of items for the Toolbar
         */
        buildToolbarTemplate: function (template, parentTemplate) {
            var languageChanger = [];

            this.options.toolbarTemplate = getToolbarTemplate.call(this, template);
            if (!this.options.changeStateCallback || typeof this.options.changeStateCallback !== 'function') {
                this.options.changeStateCallback = getChangeToolbarStateCallback.call(this, template);
            }

            // if a parentTemplate is set merge it with the current template
            if (this.options.toolbarParentTemplate !== null) {

                this.options.toolbarParentTemplate = getToolbarTemplate.call(this, parentTemplate);
                if (
                    !this.options.parentChangeStateCallback ||
                    typeof this.options.parentChangeStateCallback !== 'function'
                ) {
                    this.options.parentChangeStateCallback = getChangeToolbarStateCallback.call(this, parentTemplate);
                }

                this.options.toolbarTemplate = this.options.toolbarTemplate.concat(this.options.toolbarParentTemplate);
            }

            // if language-changer is desired add it to the current template
            if (!!this.options.toolbarLanguageChanger && !!this.options.toolbarLanguageChanger.url) {
                languageChanger = toolbarTemplates.languageChanger.call(
                    this,
                    this.options.toolbarLanguageChanger.url,
                    this.options.toolbarLanguageChanger.callback,
                    this.options.toolbarLanguageChanger.resultKey || null,
                    this.options.toolbarLanguageChanger.titleAttribute || null
                );
            } else if (!!this.options.toolbarLanguageChanger && !!this.options.toolbarLanguageChanger.data) {
                languageChanger = toolbarTemplates.languageChangerData.call(
                    this,
                    this.options.toolbarLanguageChanger.data,
                    this.options.toolbarLanguageChanger.callback
                );
            } else if (!!this.options.toolbarLanguageChanger) {
                languageChanger = toolbarTemplates.defaultLanguageChanger.call(this);
            }

            this.options.toolbarTemplate = this.options.toolbarTemplate.concat(languageChanger);
        },

        /**
         * Handles the start of the Tabs
         */
        startTabs: function () {
            var def = this.sandbox.data.deferred();

            if (!this.options.tabsOptions) {
                def.resolve();
            } else if (this.options.tabsData !== null || !!this.options.tabsOptions.data) {
                this.removeTabsComponent();

                if (this.options.tabsFullControl !== true) {
                    // first start the content-component responsible for the tabs-content-handling
                    this.startContentTabsComponent();
                    // wait for content-component to initialize
                    this.sandbox.once('sulu.content-tabs.content.initialized', function () {
                        this.startTabsComponent(def);
                    }.bind(this));
                } else {
                    this.startTabsComponent(def);
                }
            } else {
                this.removeTabsComponent();
                def.resolve();
            }

            return def;
        },

        /**
         * Starts the tabs component
         * @param {deferred} def
         */
        startTabsComponent: function (def) {
            if (!!this.options.tabsData || !!this.options.tabsOptions.data) {
                this.sandbox.stop(this.$find('.' + constants.tabsClass));
                var $container = this.sandbox.dom.createElement('<div/>'),
                    options = {
                        el: $container,
                        data: this.options.tabsData,
                        instanceName: 'header' + this.options.instanceName,
                        forceReload: false,
                        forceSelect: true,
                        fragment: this.sandbox.mvc.history.fragment
                    };

                this.sandbox.dom.addClass(this.$el, constants.hasTabsClass);
                this.sandbox.dom.addClass(constants.headerBackgroundSelector, constants.hasTabsClass);

                // wait for initialized
                this.sandbox.once('husky.tabs.header.initialized', function () {
                    def.resolve();
                }.bind(this));

                this.sandbox.dom.html(this.$find('.' + constants.tabsClass), $container);
                // merge default tabs-options with passed ones
                options = this.sandbox.util.extend(true, {}, options, this.options.tabsOptions);

                this.sandbox.start([
                    {
                        name: 'tabs@husky',
                        options: options
                    }
                ]);
            }
        },

        /**
         * Removes the tabs components
         */
        removeTabsComponent: function () {
            var $tabs = this.$find('.' + constants.tabsClass);
            this.sandbox.stop($tabs);
            this.sandbox.dom.removeClass(constants.headerBackgroundSelector, constants.hasTabsClass);
            this.sandbox.dom.removeClass(this.$el, constants.hasTabsClass);
        },

        /**
         * Sets a new toolbar into the header
         * @param options {Object} just toolbar-options. Or options with template and parentTemplate
         */
        setToolbar: function (options) {
            if (!options.template) {
                this.options.toolbarTemplate = null;
                this.options.toolbarParentTemplate = null;
                this.options.toolbarOptions = options;
            } else {
                this.options.toolbarTemplate = options.template;
                this.options.toolbarParentTemplate = (!!options.parentTemplate) ? options.parentTemplate : null;
                this.options.toolbarOptions = (!!options.toolbarOptions) ? options.toolbarOptions : {};
                this.options.toolbarLanguageChanger = (!!options.languageChanger) ? options.languageChanger : null;
            }
            this.options.toolbarDisabled = false;
            this.startToolbar();
        },

        /**
         * Handles the starting of the toolbar
         */
        startToolbar: function () {
            var def = this.sandbox.data.deferred();

            if (this.options.toolbarDisabled !== true) {
                var options = this.options.toolbarOptions;

                if (this.options.toolbarTemplate !== null) {
                    // build icon-template and parent-template and merge all in this.options.toolbarTemplate
                    this.buildToolbarTemplate(this.options.toolbarTemplate, this.options.toolbarParentTemplate);

                    // add built toolbarTemplate to the toolbar-options
                    options = this.sandbox.util.extend(true, {}, constants.toolbarDefaults, options, {
                        buttons: this.options.toolbarTemplate
                    });
                }

                // start toolbar component with built options
                this.startToolbarComponent(options, def);
            } else {
                def.resolve();
            }

            return def;
        },

        /**
         * Starts the husky-component
         * @param {object} options The options to pass to the toolbar component
         * @param {deferred} def
         */
        startToolbarComponent: function (options, def) {
            var $container = this.sandbox.dom.createElement('<div />'),
            // global default values
                componentOptions = {
                    el: $container,
                    skin: 'big',
                    instanceName: this.toolbarInstanceName
                };

            // wait for initialized
            if (!!def) {
                this.sandbox.once('husky.toolbar.' + this.toolbarInstanceName  + '.initialized', function () {
                    def.resolve();
                }.bind(this));
            }

            this.sandbox.stop(this.$find('.' + constants.toolbarClass));
            this.sandbox.dom.html(this.$find('.' + constants.toolbarClass), $container);

            // merge default tabs-options with passed ones
            componentOptions = this.sandbox.util.extend(true, {}, componentOptions, options);

            this.sandbox.start([
                {
                    name: 'toolbar@husky',
                    options: componentOptions
                }
            ]);
        },

        /**
         * listens to tab events
         */
        bindCustomEvents: function () {
            // enable langauge-dropdown after loading the language items
            this.sandbox.on('husky.toolbar.' + this.toolbarInstanceName + '.items.set', function (id) {
                if (id === 'language') {
                    this.enableLanguageChanger();
                }
            }.bind(this));

            this.sandbox.on('husky.toolbar.' + this.toolbarInstanceName + '.dropdown.opened', this.lockToolbarScroll.bind(this));
            this.sandbox.on('husky.toolbar.' + this.toolbarInstanceName + '.dropdown.closed', this.unlockToolbarScroll.bind(this));

            // changes the saved state of the toolbar
            this.sandbox.on(TOOLBAR_STATE_CHANGE.call(this), this.changeToolbarState.bind(this));

            // get height event
            this.sandbox.on(GET_HEIGHT.call(this), function (callback) {
                callback(this.sandbox.dom.outerHeight(this.$el));
            }.bind(this));

            // set or reset a toolbar
            this.sandbox.on(SET_TOOLBAR.call(this), this.setToolbar.bind(this));

            this.sandbox.on(CHANGE.call(this), this.change.bind(this));

            this.sandbox.on(HIDE.call(this), this.hide.bind(this));

            this.bindAbstractToolbarEvents();
            this.bindAbstractTabsEvents();
        },

        /**
         * Abstracts husky-toolbar events
         */
        bindAbstractToolbarEvents: function () {
            this.sandbox.on(TOOLBAR_ITEMS_SET.call(this), function (id, items) {
                this.sandbox.emit('husky.toolbar.' + this.toolbarInstanceName + '.items.set', id, items);
            }.bind(this));

            this.sandbox.on(TOOLBAR_BUTTON_SET.call(this), function (id, object) {
                this.sandbox.emit('husky.toolbar.' + this.toolbarInstanceName + '.button.set', id, object);
            }.bind(this));

            this.sandbox.on(TOOLBAR_ITEM_LOADING.call(this), function (id) {
                this.sandbox.emit('husky.toolbar.' + this.toolbarInstanceName + '.item.loading', id);
            }.bind(this));

            this.sandbox.on(TOOLBAR_ITEM_CHANGE.call(this), function (id, name) {
                this.sandbox.emit('husky.toolbar.' + this.toolbarInstanceName + '.item.change', id, name);
            }.bind(this));

            this.sandbox.on(TOOLBAR_ITEM_SHOW.call(this), function (id, name) {
                this.sandbox.emit('husky.toolbar.' + this.toolbarInstanceName + '.item.show', id, name);
            }.bind(this));

            this.sandbox.on(TOOLBAR_ITEM_ENABLE.call(this), function (id, highlight) {
                this.sandbox.emit('husky.toolbar.' + this.toolbarInstanceName + '.item.enable', id, highlight);
            }.bind(this));

            this.sandbox.on(TOOLBAR_ITEM_MARK.call(this), function (id) {
                this.sandbox.emit('husky.toolbar.' + this.toolbarInstanceName + '.item.mark', id);
            }.bind(this));
        },

        /**
         * Abstracts husky-tabs events
         */
        bindAbstractTabsEvents: function () {
            this.sandbox.on(TABS_ACTIVATE.call(this), function () {
                this.sandbox.emit('husky.tabs.header.deactivate');
            }.bind(this));

            this.sandbox.on(TABS_DEACTIVATE.call(this), function () {
                this.sandbox.emit('husky.tabs.header.activate');
            }.bind(this));
        },

        /**
         * Gets called after the language dropdown has loaded its items.
         * Shows the dropdown and eventually sets the default value
         */
        enableLanguageChanger: function () {
            if (!!this.options.toolbarLanguageChanger.preSelected) {
                this.sandbox.emit(
                    TOOLBAR_ITEM_CHANGE.call(this), 'language', this.options.toolbarLanguageChanger.preSelected
                );
            }
            this.sandbox.emit(TOOLBAR_ITEM_SHOW.call(this), 'language');
        },

        /**
         * Bind Dom-events
         */
        bindDomEvents: function () {
            this.sandbox.dom.on(this.$el, 'click', function () {
                this.sandbox.emit(BACK.call(this));
            }.bind(this), '.' + constants.backClass);
        },

        /**
         * Calles the change states callbacks and passes it the arguments
         * //todo: make it cleaner!
         * @param type {string} "edit" or "add"
         * @param saved {boolean} false if the toolbar should represent a dirty-state
         * @param highlight {boolean} true to change with a highlight effect
         */
        changeToolbarState: function (type, saved, highlight) {

            if (typeof this.options.changeStateCallback === 'function') {
                this.options.changeStateCallback.call(this, saved, type, highlight);
            }

            if (typeof this.options.parentChangeStateCallback === 'function') {
                this.options.parentChangeStateCallback.call(this, saved, type, highlight);
            }
        },

        /**
         * Starts the content component necessary and responsible for the tabs
         */
        startContentTabsComponent: function () {
            if (this.options.contentEl !== null) {
                this.sandbox.start([
                    {
                        name: 'content-tabs@suluadmin',
                        options: {
                            el: this.sandbox.dom.$(this.options.contentEl),
                            contentOptions: this.options.contentComponentOptions,
                            tabsData: this.options.tabsData
                        }
                    }
                ]);
            }
        },

        /**
         * changes the entire header
         * @param options {object} The new options
         */
        change: function (options) {
            // initialize deferreds
            var toolbarDef, tabsDef;

            this.options = this.sandbox.util.extend(true, {}, defaults, options);

            // set default callback when no callback is provided
            if (!this.options.changeStateCallback) {
                this.options.changeStateCallback = getChangeToolbarStateCallback('default');
            }

            this.$tabs = null;

            this.render();

            toolbarDef = this.startToolbar();
            tabsDef = this.startTabs();

            this.sandbox.data.when(toolbarDef, tabsDef).then(function () {
                this.sandbox.emit(INITIALIZED.call(this));
                this.show();
            }.bind(this));
        },

        /**
         * Hides the header
         */
        hide: function () {
            this.sandbox.dom.addClass(this.$el, 'invisible');
            this.sandbox.dom.hide(constants.headerBackgroundSelector);
        },

        /**
         * Shows the header
         */
        show: function () {
            this.sandbox.dom.removeClass(this.$el, 'invisible');
            this.sandbox.dom.show(constants.headerBackgroundSelector);
        }
    };
});
