/**
 * Copyright (c) 2016 - 2017, CKSource - Frederico Knabben. All rights reserved.
 */

/* global document, window, Event */

import ClassicTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/classictesteditor';
import ClickObserver from '@ckeditor/ckeditor5-engine/src/view/observer/clickobserver';

import BlockToolbar from '../../../src/toolbar/block/blocktoolbar';
import ToolbarView from '../../../src/toolbar/toolbarview';
import BalloonPanelView from '../../../src/panel/balloon/balloonpanelview';
import BlockButtonView from './../../../src/toolbar/block/view/blockbuttonview';

import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import HeadingButtonsUI from '@ckeditor/ckeditor5-heading/src/headingbuttonsui';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import ParagraphButtonUI from '@ckeditor/ckeditor5-paragraph/src/paragraphbuttonui';
import BlockQuote from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import Image from '@ckeditor/ckeditor5-image/src/image';
import ImageCaption from '@ckeditor/ckeditor5-image/src/imagecaption';

import { setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';
import testUtils from '@ckeditor/ckeditor5-core/tests/_utils/utils';

testUtils.createSinonSandbox();

describe( 'BlockToolbar', () => {
	let editor, element, blockToolbar;

	beforeEach( () => {
		element = document.createElement( 'div' );
		document.body.appendChild( element );

		return ClassicTestEditor.create( element, {
			plugins: [ BlockToolbar, Heading, HeadingButtonsUI, Paragraph, ParagraphButtonUI, BlockQuote, Image, ImageCaption ],
			blockToolbar: [ 'paragraph', 'heading1', 'heading2', 'blockQuote' ]
		} ).then( newEditor => {
			editor = newEditor;
			blockToolbar = editor.plugins.get( BlockToolbar );
		} );
	} );

	afterEach( () => {
		element.remove();
		return editor.destroy();
	} );

	it( 'should have pluginName property', () => {
		expect( BlockToolbar.pluginName ).to.equal( 'BlockToolbar' );
	} );

	it( 'should register a click observer', () => {
		expect( editor.editing.view.getObserver( ClickObserver ) ).to.be.instanceOf( ClickObserver );
	} );

	describe( 'child views', () => {
		describe( 'panelView', () => {
			it( 'should create a view instance', () => {
				expect( blockToolbar.panelView ).to.instanceof( BalloonPanelView );
			} );

			it( 'should have an additional class name', () => {
				expect( blockToolbar.panelView.className ).to.equal( 'ck-toolbar-container' );
			} );

			it( 'should be added to the ui.view.body collection', () => {
				expect( Array.from( editor.ui.view.body ) ).to.include( blockToolbar.panelView );
			} );

			it( 'should add the #panelView to ui.focusTracker', () => {
				expect( editor.ui.focusTracker.isFocused ).to.be.false;

				blockToolbar.panelView.element.dispatchEvent( new Event( 'focus' ) );

				expect( editor.ui.focusTracker.isFocused ).to.be.true;
			} );

			it( 'should close the #panelView after `Esc` is pressed and focus view document', () => {
				const spy = testUtils.sinon.spy( editor.editing.view, 'focus' );

				blockToolbar.panelView.isVisible = true;

				blockToolbar.toolbarView.keystrokes.press( {
					keyCode: keyCodes.esc,
					preventDefault: () => {},
					stopPropagation: () => {}
				} );

				expect( blockToolbar.panelView.isVisible ).to.be.false;
				sinon.assert.calledOnce( spy );
			} );

			it( 'should close the #panelView upon click outside the panel and not focus view document', () => {
				const spy = testUtils.sinon.spy();

				editor.editing.view.on( 'focus', spy );
				blockToolbar.panelView.isVisible = true;
				document.body.dispatchEvent( new Event( 'mousedown', { bubbles: true } ) );

				expect( blockToolbar.panelView.isVisible ).to.be.false;
				sinon.assert.notCalled( spy );
			} );

			it( 'should not close the #panelView upon click on panel element', () => {
				blockToolbar.panelView.isVisible = true;
				blockToolbar.panelView.element.dispatchEvent( new Event( 'mousedown', { bubbles: true } ) );

				expect( blockToolbar.panelView.isVisible ).to.be.true;
			} );
		} );

		describe( 'toolbarView', () => {
			it( 'should create the view instance', () => {
				expect( blockToolbar.toolbarView ).to.instanceof( ToolbarView );
			} );

			it( 'should add an additional class to toolbar element', () => {
				expect( blockToolbar.toolbarView.element.classList.contains( 'ck-toolbar_floating' ) ).to.be.true;
			} );

			it( 'should be added to the panelView#content collection', () => {
				expect( Array.from( blockToolbar.panelView.content ) ).to.include( blockToolbar.toolbarView );
			} );

			it( 'should initialize the toolbar items based on Editor#blockToolbar config', () => {
				expect( Array.from( blockToolbar.toolbarView.items ) ).to.length( 4 );
			} );

			it( 'should hide the panel after clicking on the button from toolbar', () => {
				blockToolbar.buttonView.fire( 'execute' );

				expect( blockToolbar.panelView.isVisible ).to.be.true;

				blockToolbar.toolbarView.items.get( 0 ).fire( 'execute' );

				expect( blockToolbar.panelView.isVisible ).to.be.false;
			} );
		} );

		describe( 'buttonView', () => {
			it( 'should create a view instance', () => {
				expect( blockToolbar.buttonView ).to.instanceof( BlockButtonView );
			} );

			it( 'should be added to the editor ui.view.body collection', () => {
				expect( Array.from( editor.ui.view.body ) ).to.include( blockToolbar.buttonView );
			} );

			it( 'should add the #buttonView to the ui.focusTracker', () => {
				expect( editor.ui.focusTracker.isFocused ).to.be.false;

				blockToolbar.buttonView.element.dispatchEvent( new Event( 'focus' ) );

				expect( editor.ui.focusTracker.isFocused ).to.be.true;
			} );

			it( 'should pin the #panelView to the button and focus first item in toolbar on #execute event', () => {
				expect( blockToolbar.panelView.isVisible ).to.be.false;

				const pinSpy = testUtils.sinon.spy( blockToolbar.panelView, 'pin' );
				const focusSpy = testUtils.sinon.spy( blockToolbar.toolbarView.items.get( 0 ), 'focus' );

				blockToolbar.buttonView.fire( 'execute' );

				expect( blockToolbar.panelView.isVisible ).to.be.true;
				sinon.assert.calledWith( pinSpy, {
					target: blockToolbar.buttonView.element,
					limiter: editor.ui.view.editableElement
				} );
				sinon.assert.calledOnce( focusSpy );
			} );

			it( 'should hide the #panelView and focus the editable on #execute event when panel was visible', () => {
				blockToolbar.panelView.isVisible = true;
				const spy = testUtils.sinon.spy( editor.editing.view, 'focus' );

				blockToolbar.buttonView.fire( 'execute' );

				expect( blockToolbar.panelView.isVisible ).to.be.false;
				sinon.assert.calledOnce( spy );
			} );

			it( 'should bind #isOn to panelView#isVisible', () => {
				blockToolbar.panelView.isVisible = false;

				expect( blockToolbar.buttonView.isOn ).to.be.false;

				blockToolbar.panelView.isVisible = true;

				expect( blockToolbar.buttonView.isOn ).to.be.true;
			} );

			it( 'should hide the #button tooltip when the #panelView is open', () => {
				blockToolbar.panelView.isVisible = false;

				expect( blockToolbar.buttonView.tooltip ).to.be.true;

				blockToolbar.panelView.isVisible = true;

				expect( blockToolbar.buttonView.tooltip ).to.be.false;
			} );
		} );
	} );

	describe( 'allowed elements', () => {
		it( 'should display the button when the first selected block is a block element', () => {
			editor.model.schema.register( 'foo', { inheritAllFrom: '$block' } );
			editor.conversion.elementToElement( { model: 'foo', view: 'foo' } );

			setData( editor.model, '<foo>foo[]bar</foo>' );

			expect( blockToolbar.buttonView.isVisible ).to.be.true;
		} );

		it( 'should display the button when the first selected block is an object', () => {
			setData( editor.model, '[<image src="foo.jpg"><caption>foo</caption></image>]' );

			expect( blockToolbar.buttonView.isVisible ).to.be.true;
		} );

		it( 'should display the button when the selection is inside the object', () => {
			setData( editor.model, '<image src="foo.jpg"><caption>f[]oo</caption></image>' );

			expect( blockToolbar.buttonView.isVisible ).to.be.true;
		} );

		it( 'should not display the button when the selection is placed in a root element', () => {
			setData( editor.model, '<paragraph>foo</paragraph>[]<paragraph>bar</paragraph>' );

			expect( blockToolbar.buttonView.isVisible ).to.be.false;
		} );

		it( 'should not display the button when all toolbar items are disabled for the selected element', () => {
			const element = document.createElement( 'div' );

			document.body.appendChild( element );

			return ClassicTestEditor.create( element, {
				plugins: [ BlockToolbar, Heading, HeadingButtonsUI, Paragraph, ParagraphButtonUI, Image ],
				blockToolbar: [ 'paragraph', 'heading1', 'heading2' ]
			} ).then( editor => {
				const blockToolbar = editor.plugins.get( BlockToolbar );

				setData( editor.model, '[<image src="foo.jpg"></image>]' );

				expect( blockToolbar.buttonView.isVisible ).to.be.false;

				element.remove();

				return editor.destroy();
			} );
		} );
	} );

	describe( 'attaching the button to the content', () => {
		it( 'should attach the right side of the button to the left side of the editable and center with the first line ' +
			'of the selected block #1', () => {
			setData( editor.model, '<paragraph>foo[]bar</paragraph>' );

			const target = editor.ui.view.editableElement.querySelector( 'p' );
			const styleMock = testUtils.sinon.stub( window, 'getComputedStyle' );

			styleMock.withArgs( target ).returns( {
				lineHeight: '20px',
				paddingTop: '10px'
			} );

			styleMock.callThrough();

			testUtils.sinon.stub( editor.ui.view.editableElement, 'getBoundingClientRect' ).returns( {
				left: 200
			} );

			testUtils.sinon.stub( target, 'getBoundingClientRect' ).returns( {
				top: 500,
				left: 300
			} );

			testUtils.sinon.stub( blockToolbar.buttonView.element, 'getBoundingClientRect' ).returns( {
				width: 100,
				height: 100
			} );

			editor.editing.view.fire( 'render' );

			expect( blockToolbar.buttonView.top ).to.equal( 470 );
			expect( blockToolbar.buttonView.left ).to.equal( 100 );
		} );

		it( 'should attach the right side of the button to the left side of the editable and center with the first line ' +
			'of the selected block #2', () => {
			setData( editor.model, '<paragraph>foo[]bar</paragraph>' );

			const target = editor.ui.view.editableElement.querySelector( 'p' );
			const styleMock = testUtils.sinon.stub( window, 'getComputedStyle' );

			styleMock.withArgs( target ).returns( {
				lineHeight: 'normal',
				fontSize: '20px',
				paddingTop: '10px'
			} );

			styleMock.callThrough();

			testUtils.sinon.stub( editor.ui.view.editableElement, 'getBoundingClientRect' ).returns( {
				left: 200
			} );

			testUtils.sinon.stub( target, 'getBoundingClientRect' ).returns( {
				top: 500,
				left: 300
			} );

			testUtils.sinon.stub( blockToolbar.buttonView.element, 'getBoundingClientRect' ).returns( {
				width: 100,
				height: 100
			} );

			editor.editing.view.fire( 'render' );

			expect( blockToolbar.buttonView.top ).to.equal( 472 );
			expect( blockToolbar.buttonView.left ).to.equal( 100 );
		} );

		it( 'should reposition the #panelView when open on view#render', () => {
			blockToolbar.panelView.isVisible = false;

			const spy = testUtils.sinon.spy( blockToolbar.panelView, 'pin' );

			editor.editing.view.fire( 'render' );

			sinon.assert.notCalled( spy );

			blockToolbar.panelView.isVisible = true;

			editor.editing.view.fire( 'render' );

			sinon.assert.calledWith( spy, {
				target: blockToolbar.buttonView.element,
				limiter: editor.ui.view.editableElement
			} );
		} );

		it( 'should not reset the toolbar focus on view#render', () => {
			blockToolbar.panelView.isVisible = true;

			const spy = testUtils.sinon.spy( blockToolbar.toolbarView, 'focus' );

			editor.editing.view.fire( 'render' );

			sinon.assert.notCalled( spy );
		} );

		it( 'should hide the open panel on a direct selection change', () => {
			blockToolbar.panelView.isVisible = true;

			editor.model.document.selection.fire( 'change:range', { directChange: true } );

			expect( blockToolbar.panelView.isVisible ).to.be.false;
		} );

		it( 'should not hide the open panel on a indirect selection change', () => {
			blockToolbar.panelView.isVisible = true;

			editor.model.document.selection.fire( 'change:range', { directChange: false } );

			expect( blockToolbar.panelView.isVisible ).to.be.true;
		} );

		it( 'should hide the UI when editor switches to readonly when the panel is not visible', () => {
			setData( editor.model, '<paragraph>foo[]bar</paragraph>' );

			blockToolbar.buttonView.isVisible = true;
			blockToolbar.panelView.isVisible = false;

			editor.isReadOnly = true;

			expect( blockToolbar.buttonView.isVisible ).to.be.false;
			expect( blockToolbar.panelView.isVisible ).to.be.false;
		} );

		it( 'should not hide button when the editor switches to readonly when the panel is visible', () => {
			setData( editor.model, '<paragraph>foo[]bar</paragraph>' );

			blockToolbar.buttonView.isVisible = true;
			blockToolbar.panelView.isVisible = true;

			editor.isReadOnly = true;

			expect( blockToolbar.buttonView.isVisible ).to.be.true;
			expect( blockToolbar.panelView.isVisible ).to.be.true;
		} );

		it( 'should update the button position on browser resize only when the button is visible', () => {
			const spy = testUtils.sinon.spy( blockToolbar, '_attachButtonToElement' );

			setData( editor.model, '[]<paragraph>bar</paragraph>' );

			window.dispatchEvent( new Event( 'resize' ) );

			sinon.assert.notCalled( spy );

			setData( editor.model, '<paragraph>ba[]r</paragraph>' );

			spy.resetHistory();

			window.dispatchEvent( new Event( 'resize' ) );

			sinon.assert.called( spy );

			setData( editor.model, '[]<paragraph>bar</paragraph>' );

			spy.resetHistory();

			window.dispatchEvent( new Event( 'resize' ) );

			sinon.assert.notCalled( spy );
		} );
	} );
} );
