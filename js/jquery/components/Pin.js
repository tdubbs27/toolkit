/**
 * @copyright   2010-2013, The Titon Project
 * @license     http://opensource.org/licenses/bsd-license.php
 * @link        http://titon.io
 */

(function($) {
    'use strict';

    Toolkit.Pin = Toolkit.Component.create(function(element, options) {
        this.component = 'Pin';
        this.version = '0.0.0';

        /** Custom options */
        this.options = this.setOptions(Toolkit.Pin.options, options);

        /** Element to pin */
        this.element = this.setElement(element, this.options);

        /** The current window width and height */
        this.viewport = null;

        /** Target and container sizes */
        this.elementHeight = null;
        this.elementTop = null;

        this.parentHeight = null;
        this.parentTop = null;

        this.initialize();
    });

    Toolkit.Pin.options = {
        animation: '',
        location: 'right',
        xOffset: 0,
        yOffset: 0,
        throttle: 50,
        fixed: false,
        calculate: false,
        context: null
    };

    var Pin = Toolkit.Pin.prototype;

    /**
     * Initialize the component by fetching elements and binding events.
     */
    Pin.initialize = function() {
        this.element.addClass(Toolkit.options.vendor + 'pin');
        this.elementTop = parseInt(this.element.css('top'), 10);

        $(window).on('scroll', $.throttle(this.__scroll.bind(this), this.options.throttle));
        $(window).on('resize', $.throttle(this.__resize.bind(this), this.options.throttle));
        $(document).ready(this.__resize.bind(this));

        this.fireEvent('init');
    };

    /**
     * Calculate the dimensions and offsets of the interacting elements.
     *
     * @returns {Toolkit.Pin}
     */
    Pin.calculate = function() {
        var win = $(window),
            parent = this.element.parents(this.options.context);

        this.viewport = {
            width: win.width(),
            height: win.height()
        };

        this.elementHeight = this.element.outerHeight();
        this.parentHeight = parent.outerHeight();
        this.parentTop = parent.offset().top;

        return this;
    };

    /**
     * Determine whether to pin or unpin.
     *
     * @private
     */
    Pin.__resize = function() {
        this.calculate();

        // Enable pin if the parent is larger than the child
        if (this.parentHeight >= this.elementHeight) {
            this.enable();
        } else {
            this.disable();
        }

        this.fireEvent('resize');
    };

    /**
     * While the viewport is being scrolled, the element should move vertically along with it.
     * The element should also stay contained within the parent element.
     *
     * @private
     */
    Pin.__scroll = function() {
        if (this.options.calculate) {
            this.calculate();
        }

        if (!this.enabled || this.element.is(':hidden')) {
            return;
        }

        var options = this.options,
            isFixed = options.fixed,
            eHeight = this.elementHeight,
            eTop = this.elementTop,
            pHeight = this.parentHeight,
            pTop = this.parentTop,
            scrollTop = $(window).scrollTop(),
            pos = {},
            x = options.xOffset,
            y = 0;

        // Scroll is above the parent, remove pin inline styles
        if (scrollTop < pTop) {
            this.element
                .removeAttr('style')
                .addClass(Toolkit.options.isPrefix + 'pinned');

            return;
        }

        // Don't extend out the bottom
        var elementMaxPos = scrollTop + eHeight,
            parentMaxHeight = pHeight + pTop;

        // Swap positioning of the fixed menu once it reaches the parent borders
        if (isFixed) {
            if (elementMaxPos >= parentMaxHeight) {
                y = 'auto';

                pos.position = 'absolute';
                pos.bottom = 0;
            } else {
                pos.position = 'fixed';
                pos.bottom = 'auto';
            }

        // Stop positioning absolute menu once it exits the parent
        } else {
            pos.position = 'absolute';

            if (elementMaxPos >= parentMaxHeight) {
                y += (pHeight - eHeight);

            } else {
                y += (scrollTop - pTop) + options.yOffset;
            }

            // Don't go lower than default top
            if (eTop && y < eTop) {
                y = eTop;
            }
        }

        pos[options.location] = x;
        pos.top = y;

        this.element
            .css(pos)
            .addClass(Toolkit.options.isPrefix + 'pinned');

        this.fireEvent('scroll');
    };

    /**
     * Defines a component that can be instantiated through pin().
     */
    Toolkit.createComponent('pin', function(options) {
        return new Toolkit.Pin(this, options);
    });

})(jQuery);