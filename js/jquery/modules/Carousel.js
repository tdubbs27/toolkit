/**
 * @copyright   2010-2013, The Titon Project
 * @license     http://opensource.org/licenses/bsd-license.php
 * @link        http://titon.io
 */

(function($) {
    'use strict';

Titon.Carousel = function(element, options) {

    /** Custom options */
    this.options = Titon.setOptions($.fn.carousel.options, options);

    /** Primary DOM wrapper */
    this.element = Titon.setElement(element, this.options);

    /** Is the carousel stopped? */
    this.stopped = false;

    /** Items and parent container */
    this.itemsWrapper = null;
    this.items = [];

    /** Item dimensions */
    this.itemWidth = 0;
    this.itemHeight = 0;

    /** Tabs and parent container */
    this.tabsWrapper = null;
    this.tabs = [];

    /** Previous and next buttons */
    this.prevButton = null;
    this.nextButton = null;

    /** The current and previous shown indices */
    this.previousIndex = 0;
    this.currentIndex = 0;

    /** Cycle timer */
    this.timer = null;

    /**
     * Initialize items and events for a matrix grid.
     */
    this.initialize = function() {
        var options = this.options;

        // Get elements
        this.itemsWrapper = this.element.find(options.itemsElement);
        this.items = this.itemsWrapper.find(options.itemElement);

        this.tabsWrapper = this.element.find(options.tabsElement);
        this.tabs = this.tabsWrapper.find(options.tabElement);

        this.nextButton = this.element.find(options.nextElement);
        this.prevButton = this.element.find(options.prevElement);

        // Disable carousel if too low of items
        if (this.items.length <= 1) {
            this.tabsWrapper.hide();
            this.nextButton.hide();
            this.prevButton.hide();

            return;
        }

        // Set some sizes for responsiveness
        switch (options.animation) {
            case 'fade':
                $(this.items[0]).reveal();
            break;
            case 'slide':
                this.itemsWrapper.css('width', (this.items.length * 100) + '%');
                this.items.css('width', (100 / this.items.length) + '%');
            break;
        }

        // Store some data in the elements
        this.tabs.each(function(index) {
            $(this).data('index', index);
        });

        // Set events
        this.disable().enable();

        $(window)
            .on('keydown', function(e) {
                switch (e.key.toLowerCase()) {
                    case 'up':      this.jump(0); break;
                    case 'down':    this.jump(-1); break;
                    case 'left':    this.prev(); break;
                    case 'right':   this.next(); break;
                }
            }.bind(this))
            .on('resize', this._resize.bind(this));
    };

    /**
     * Disable events.
     *
     * @returns {Titon.Carousel}
     */
    this.disable = function() {
        if (this.options.stopOnHover) {
            this.element
                .off('mouseenter', this.stop.bind(this))
                .off('mouseleave', this.start.bind(this));
        }

        this.tabs.off('click', this._jump.bind(this));
        this.nextButton.off('click', this.next.bind(this));
        this.prevButton.off('click', this.prev.bind(this));

        this.stop();
        this._reset();

        return this;
    };

    /**
     * Enable events.
     *
     * @returns {Titon.Carousel}
     */
    this.enable = function() {
        if (this.options.stopOnHover) {
            this.element
                .on('mouseenter', this.stop.bind(this))
                .on('mouseleave', this.start.bind(this));
        }

        this.tabs.on('click', this._jump.bind(this));
        this.nextButton.on('click', this.next.bind(this));
        this.prevButton.on('click', this.prev.bind(this));

        this.start();
        this._reset();

        return this;
    };

    /**
     * Go to the item indicated by the index number.
     * If the index is too large, jump to the beginning.
     * If the index is too small, jump to the end.
     *
     * @param {Number} index
     * @returns {Titon.Carousel}
     */
    this.jump = function(index) {
        if (index >= this.items.length) {
            index = 0;
        } else if (index < 0) {
            index = this.items.length - 1;
        }

        // Save state
        this.previousIndex = this.currentIndex;
        this.currentIndex = index;

        // Update tabs
        if (this.tabs.length) {
            this.tabs.removeClass('is-active');
            $(this.tabs[index]).addClass('is-active');
        }

        // Animate!
        switch (this.options.animation) {
            case 'fade':
                // Don't use conceal() as it causes the animation to flicker
                this.items.removeClass('show');
                $(this.items[index]).reveal();
            break;
            case 'slide-up':
                if (!this.itemHeight) {
                    this._resize();
                }

                // Animating top property doesn't work with percentages
                this.itemsWrapper.css('top', -(index * this.itemHeight) + 'px');
            break;
            default:
                this.itemsWrapper.css('left', -(index * 100) + '%');
            break;
        }

        this._reset();

        return this;
    };

    /**
     * Go to the next item.
     *
     * @returns {Titon.Carousel}
     */
    this.next = function() {
        this.jump(this.currentIndex + 1);

        return this;
    };

    /**
     * Go to the previous item.
     *
     * @returns {Titon.Carousel}
     */
    this.prev = function() {
        this.jump(this.currentIndex - 1);

        return this;
    };

    /**
     * Start the carousel.
     *
     * @returns {Titon.Carousel}
     */
    this.start = function() {
        this.element.removeClass('is-stopped');
        this.stopped = false;

        return this;
    };

    /**
     * Stop the carousel.
     *
     * @returns {Titon.Carousel}
     */
    this.stop = function() {
        this.element.addClass('is-stopped');
        this.stopped = true;

        return this;
    };

    /**
     * Event handler for cycling between items.
     * Will stop cycling if carousel is stopped.
     *
     * @private
     */
    this._cycle = function() {
        if (!this.itemWidth || !this.itemHeight) {
            this._resize();
        }

        // Don't cycle if the carousel has stopped
        if (!this.stopped) {
            this.next();
        }
    };

    /**
     * Event handler for jumping between items.
     *
     * @private
     * @param {Event} e
     */
    this._jump = function(e) {
        e.preventDefault();
        e.stopPropagation();

        this.jump($(e.target).data('index') || 0);
    };

    /**
     * Reset the timer.
     */
    this._reset = function() {
        if (this.options.autoCycle) {
            clearInterval(this.timer);
            this.timer = setInterval(this._cycle.bind(this), this.options.duration);
        }
    };

    /**
     * Cache sizes once the carousel starts or when browser is resized.
     * We need to defer this to allow image loading.
     *
     * @private
     */
    this._resize = function() {
        var item = $(this.items[0]);

        this.itemWidth = item.outerWidth();
        this.itemHeight = item.outerHeight();

        // Set height since items are absolute positioned
        if (this.options.animation !== 'slide') {
            this.itemsWrapper.css('height', this.itemHeight + 'px');
        }
    };

    // Initialize the class only if the element exists
    if (this.element.length) {
        this.initialize();
    }
};

/**
 * Allow the carousel to be created on elements by calling carousel().
 * An object of options can be passed as the 1st argument.
 * The class instance will be cached and returned from this function.
 *
 * @example
 *     $('#carousel-id').carousel({
 *         stopOnHover: true
 *     });
 *
 * @param {Object} [options]
 * @returns {Titon.Carousel}
 */
$.fn.carousel = function(options) {
    return this.each(function() {
        if (this.$carousel) {
            return this.$carousel;
        }

        this.$carousel = new Titon.Carousel(this, options);

        return this.$carousel;
    });
};

$.fn.carousel.options = {
    className: '',
    animation: 'slide',
    duration: 5000,
    autoCycle: true,
    stopOnHover: true,
    itemsElement: '.carousel-items',
    itemElement: 'li',
    tabsElement: '.carousel-tabs',
    tabElement: 'a',
    nextElement: '.carousel-next',
    prevElement: '.carousel-prev',
    template: false
};

})(jQuery);