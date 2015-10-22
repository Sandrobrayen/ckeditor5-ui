/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Basic View class.
 *
 * @class View
 * @extends Model
 */

CKEDITOR.define( [
	'collection',
	'model',
	'ui/template',
	'ckeditorerror',
	'ui/domemittermixin',
	'utils'
], function( Collection, Model, Template, CKEditorError, DOMEmitterMixin, utils ) {
	class View extends Model {
		/**
		 * Creates an instance of the {@link View} class.
		 *
		 * @param {Model} mode (View)Model of this View.
		 * @constructor
		 */
		constructor( model ) {
			super();

			/**
			 * Model of this view.
			 */
			this.model = new Model( model );

			/**
			 * Regions which belong to this view.
			 */
			this.regions = new Collection();

			/**
			 * The list of listeners attached in this view.
			 *
			 * @property {Array}
			 */
			this.listeners = [];
		}

		/**
		 * Element of this view. The element is rendered on first reference.
		 *
		 * @property el
		 */
		get el() {
			if ( this._el ) {
				return this._el;
			}

			// Render the element using the template.
			this._el = this.render();

			// Attach defined listeners.
			this.listeners.map( l => l.call( this ) );

			return this._el;
		}

		/**
		 * Binds a property of the model to a specific listener that
		 * updates the view when the property changes.
		 *
		 * @param {Model} model Model to which the property is bound to.
		 * @param {String} property Property name in the model.
		 * @param {Function} [callback] Callback function executed on property change in model.
		 * @constructor
		 */
		bind( property, callback ) {
			var model = this.model;

			return function attachModelListener( el, domUpdater ) {
				// TODO: Use ES6 default arguments syntax.
				callback = callback || domUpdater;

				var listenerCallback = ( evt, value ) => {
					var processedValue = callback( el, value );

					if ( typeof processedValue != 'undefined' ) {
						domUpdater( el, processedValue );
					}
				};

				// Execute callback when the property changes.
				this.listenTo( model, 'change:' + property, listenerCallback );

				// Set the initial state of the view.
				listenerCallback( null, model[ property ] );
			}.bind( this );
		}

		/**
		 * Binds native DOM event listener to View event.
		 *
		 * @param {HTMLElement} el DOM element that fires the event.
		 * @param {String} domEvt The name of DOM event the listener listens to.
		 * @param {String} fireEvent The name of the View event fired then DOM event fires.
		 */
		domListener( el, domEvt, fireEvt ) {
			el.addEventListener( domEvt, this.fire.bind( this, fireEvt ) );
		}

		/**
		 * Renders View's {@link el} using {@link Template} instance.
		 *
		 * @returns {HTMLElement}
		 */
		render() {
			if ( !this.template ) {
				throw new CKEditorError(
					'ui-view-notemplate: This View implements no template to render.',
					{ view: this }
				);
			}

			this._template = new Template( this.template );

			return this._template.render();
		}

		destroy() {
			// Drop the reference to the model.
			this.model = null;

			// Remove View's element from DOM.
			if ( this.template ) {
				this.el.remove();
			}

			// Remove and destroy regions.
			for ( let i = this.regions.length; i--; ) {
				this.regions.remove( i ).destroy();
			}

			// Remove all listeners related to this view.
			this.stopListening();
		}
	}

	utils.extend( View.prototype, DOMEmitterMixin );

	return View;
} );
