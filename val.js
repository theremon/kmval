var kmval = {};

kmval.validationChecks = {
	num			: /^[\-]{0,1}[0-9]+(\.[0-9]{1,12})?$/,
	int			: /^[\-]{0,1}[0-9]+$/,
	bit			: /^[01]$/,
	guid		: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
	email		: /^[a-zA-Z0-9.!#$%&’*+\=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/, // W3C HTML5 spec (methinks)
	username	: /^[a-z0-9]{3,20}$/i,
	password	: /^.{5,50}$/,
	grmobile	: /^69[0-9]{8}$/,
	grzip		: /^[1-9]{1}[0-9]{4}$/, // Greek zipcode because... blah
	grdoy		: /^[1-9]{1}[0-9]{3}$/, // Greek DOY Code - actually just a 4-digit ID
	vatno		: /^[0-9]{9}$/, // This is the Greek VAT No. Actually it should be checked more thoroughly, but let's just with the "only 9 digits" rule
	anystring	: /^.+$/,
};

/**
 * Validation Rule object
 * @param {string|function}		value 		- The value to be validated, or a function returning it
 * @param {function|RegExp|any}	rule 		- A RegExp that can be one of the pre-defined rules, or a custom one. Alternatively, it may be a value or function returning a RegExp object or an exact value
 * @param {boolean} 			required	- Whether the value is required or not (because may not be required, but still needs to follow validation rules if supplied)
 * @param {string|object}		element 	- The selector or jQuery object of the element that holds the value. Needed if we have no value passed
 * @param {string|object|array}	css 		- The css class to apply when there is a problem
 * @param {object|object[]} 	linked 		- A validationRule or array of validationRule objects that also need to be true, for the current validation to pass
 *
 */
kmval.validationRule = function ( value, rule, required, element, css, linked ) {
	this.value		= value;
	this.rule		= rule;
	this.required	= required;
	this.element	= element;
	this.css		= css;
	this.linked		= linked;
};

/**
 * Runs a RegExp-based check on values
 * @param {object} rule - The validation rule to run. Should be a valid validationRule object
 * @param {boolean} retvalue - If the test is successful, defines whether to return the value (when true) or a true/false result
 */
kmval.validateInput = function ( rule, retvalue ) {
	var res;
	var $el;

	retvalue = retvalue || false;

	if ( rule.element ) {
		$el = rule.element.constructor === String ? $(rule.element) : rule.element; // if we've been given a string, convert to jQuery object
		if ($el.length > 1) { // make sure we're working with only one element
			// radiobuttons need to be handled differently since the selector may return an array of them
			// normally we should be more strict, but lets base our 'is-it-a-radio' check only on the first element for now
			if ($el.first().prop('type') === 'radio') {
				// select the checked one
				// or if none is checked, return nothing
				$el = $el.filter(':checked');
				//$el = undefined;
			} else {
				$el = $el.first();
			}
		}
	}

	if (rule.value && rule.value.constructor === Function) { // function as a value
		rule.value = rule.value(); // execute function and feed the result back into the value
	}

	if (( rule.value === undefined ) && $el) { // no value was given, get it 'live' from the element (through jquery .val())
		rule.value = $el.val();
	}

	if ( rule.required && !rule.value ) // value is required but empty
		{ res = false; }
	else if ( !rule.required && !rule.value ) // value is not required and empty
		{ res = true; }
	else { // required or not, value is validated
		if (rule.rule.constructor === Function) { // function as a rule - needs to return a RegExp
			rule.rule = rule.rule(rule.value); // execute function and feed the result back into the rule
		}

		if (rule.rule.constructor === RegExp) { // object is treated as RegExp, so test against it
			res = rule.rule.test( rule.value );
		} else { // not an object, so check for exact value match
			res = rule.rule === rule.value;
		}
	}

	// if the result is an error, css-process it (set 'on')
	// if all is good, remove any css from previous attempts (set 'off)
	kmval.setValidationCSS( !res ? 'on' : 'off' , rule, $el );

	//------------------------------
	if ( !res ) { return false; }

	return ( retvalue ? rule.value : true );
};

/**
 * Adds or removes the a rule's css classes to a specified element
 * @param {string} onoff - Set to 'on' if the rules should be added, or 'off' if they should be removed
 * @param {object} rule - The related rule object
 * @param {object} $el - The jQuery object for the related element
 */
kmval.setValidationCSS = function ( onoff, rule, $el) {
	var add = onoff === 'on' ? true : false;

	if ( rule.css && rule.css.constructor === Array ) {
		for (var e = 0; e < rule.css.length; e++) {
			$el = $(rule.css[e].el);
			if (add) { $el.addClass( rule.css[e].css ); }
			else { $el.removeClass( rule.css[e].css ); }
		}
	}
	if ( rule.css && rule.css.constructor === Object ) {
		if (add) { $(rule.css.el).addClass( rule.css.css ); }
		else { $(rule.css.el).removeClass( rule.css.css ); }
	}
	if ( rule.css && rule.css.constructor === String && $el ) {
		if (add) { $el.addClass( rule.css ); }
		else { $el.removeClass( rule.css ); }
	}
};

/**
 * Runs a RegExp-based check on a given form, based on a rules object
 * @param {Array} objChecks - Array of 'check' objects describing the validation logic
 */
kmval.validateForm = function ( arChecks, stopAtFirst ) {

	if (typeof arChecks === 'undefined' || arChecks.length === 0) {
		return false;
	}

	var chk = {}; // copy of rule element so that we don't mess up the original object
	var res;
	var ret = true;
	var $el;
	var evnt = '';

	stopAtFirst = stopAtFirst || false;

	for (var i = 0; i < arChecks.length; i++) {
		// create the copy
		chk = {
			value: arChecks[i].value,
			rule: arChecks[i].rule,
			required: arChecks[i].required,
			element: arChecks[i].element,
			css: arChecks[i].css,
			linked: arChecks[i].linked,
		};

		res = kmval.validateInput( chk );

		if (!res) {
			// for debugging info only
			console.log('Check failed for ' + JSON.stringify( chk ));
			ret = false;

			$el = ( arChecks[i].element.constructor === jQuery ? arChecks[i].element : $(arChecks[i].element) );

			// add jQuery event to reset css on keypress (since the data is being changed and as such validation result is obsolete)
			// we namespace the event as 'pgval', in order to access it later on without messing up any other handlers
			// like before we check (based on the first element in case of an array), if we got a radiobutton or a checkbox
			// we need to do this because these two are more likely to be changed using a mouse instead of the keyboard
			if ($el.first().prop('type') === 'radio' || $el.first().prop('type') === 'checkbox') {
				evnt = 'change.pgval';
			} else {
				evnt = 'keydown.pgval';
			}
			$el.on(evnt, chk, function(event) {
				// reset any validation css
				kmval.setValidationCSS( 'off', event.data, $(this) );
				// remove event so it doesn't fire again
				$(this).off(evnt);
			});

			if (stopAtFirst) return false;
		}

	}

	return ret;
};

kmval.resetForm = function ( arChecks ) {
	var $el, chk = {};

	if (typeof arChecks === 'undefined' || arChecks.length === 0) {
		return false;
	}

	for (var i = 0; i < arChecks.length; i++) {
		// create the copy
		chk = {
			value: arChecks[i].value,
			rule: arChecks[i].rule,
			required: arChecks[i].required,
			element: arChecks[i].element,
			css: arChecks[i].css,
			linked: arChecks[i].linked,
		};

		$el = ( arChecks[i].element.constructor === jQuery ? arChecks[i].element : $(arChecks[i].element) );
		kmval.setValidationCSS( 'off', chk, $el );
	}
};

// For my friend MS... Cheers mate