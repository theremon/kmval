/* global kmval */

var kmapp = {};

kmapp.validateGreekVatNo = function(afm) {
	// adaptation of https://gist.github.com/tdoumas/7875550
	if (!afm.match(/^\d{9}$/) || afm === '000000000')
		{ return false; }

	var m = 1, sum = 0;
	for (var i = 7; i >= 0; i--) {
		m *= 2;
		sum += afm.charAt(i) * m;
	}

	return (parseInt(sum % 11 % 10, 10) === parseInt(afm.charAt(8))) ? afm : false;
};

// kmval.validationRule ( value, rule, required, element, css, linked )

kmapp.loginuserchk_un = [
	new kmval.validationRule(undefined, kmval.validationChecks.username, true, 'input[name="txtLoginUsername"]', 'validationerror'),
	new kmval.validationRule(undefined, kmval.validationChecks.password, true, 'input[name="txtLoginPassword"]', 'validationerror'),
];
kmapp.loginuserchk_em = [
	new kmval.validationRule(undefined, kmval.validationChecks.email, true, 'input[name="txtLoginUsername"]', 'validationerror'),
	new kmval.validationRule(undefined, kmval.validationChecks.password, true, 'input[name="txtLoginPassword"]', 'validationerror'),
];
kmapp.reguserchk = [
	new kmval.validationRule(undefined, kmval.validationChecks.username, true, 'input[name="txtRegisterUsername"]', 'validationerror'),
	new kmval.validationRule(undefined, kmval.validationChecks.email, true, 'input[name="txtRegisterEmail"]', 'validationerror'),
	new kmval.validationRule(undefined, kmval.validationChecks.password, true, 'input[name="txtRegisterPassword"]', 'validationerror'),
	new kmval.validationRule(undefined, kmval.validationChecks.password, true, 'input[name="txtRegisterVerifyPassword"]', 'validationerror'),
	// extra function-based rule
	new kmval.validationRule(undefined, function(){ return $('input[name="txtRegisterPassword"]').val(); }, true, 'input[name="txtRegisterVerifyPassword"]', 'validationerror'),
	new kmval.validationRule(undefined, new RegExp(/^[012]$/), false, 'select[name="selOrderGender"]', 'validationerror'),
	new kmval.validationRule(undefined, kmval.validationChecks.anystring, true, 'input[name="txtRegisterFirstname"]', 'validationerror'),
	new kmval.validationRule(undefined, kmval.validationChecks.anystring, true, 'input[name="txtRegisterLastname"]', 'validationerror'),
	new kmval.validationRule(undefined, kmval.validationChecks.grmobile, true, 'input[name="txtRegisterMobileNo"]', 'validationerror'),
	// optional check, using different element for error display
	new kmval.validationRule(undefined, kmval.validationChecks.grzip, false, 'input[name="txtRegisterBillingZipCode"]',
		[{ el:'input[name="txtRegisterBillingZipCode"]',css:'validationerrorline' },{ el:'.billingrequiredprompt',css:'visibleerror' }])
];
kmapp.reguserinvoicechk = [
	new kmval.validationRule(undefined, kmval.validationChecks.anystring, true, 'input[name="txtRegisterBillingCompanyName"]', 'validationerrorvertical'),
	new kmval.validationRule(undefined, kmval.validationChecks.anystring, true, 'input[name="txtRegisterBillingActivity"]', 'validationerrorvertical'),
	// Here, the rule is a function with its own logic, which returns false if it fails
	new kmval.validationRule(undefined, kmapp.validateGreekVatNo, true, 'input[name="txtRegisterBillingVatNo"]', 'validationerrorvertical'),
	new kmval.validationRule(undefined, kmval.validationChecks.grdoy, true, 'select[name="selRegisterBillingDOY"]', 'validationerrorvertical'),
	new kmval.validationRule(undefined, kmval.validationChecks.anystring, true, 'input[name="txtRegisterBillingPhoneNo"]', 'validationerrorvertical'),
];

kmapp.registerUser = function (e) {
	var validationfailed = false;
	var chkRegisterInvoice = $('input[name="chkRegisterInvoice"]').prop('checked') ? 1 : 0;

	// cancel normal click
	e.preventDefault();

	// run validations etc
	if (!kmval.validateForm(kmapp.reguserchk)) {
		validationfailed = true;
	}
	if (chkRegisterInvoice === 1 && !kmval.validateForm(kmapp.reguserinvoicechk)) {
		validationfailed = true;
	}

	if (validationfailed) { return false; }

	alert('register ok!');

	return;
};

kmapp.loginUser = function (e) {
	// cancel normal click
	e.preventDefault();

	// run validations etc
	// run check simple username check and if it fails, run the email check. If both fail, abort abort abort!
	if (!kmval.validateForm(kmapp.loginuserchk_un) && !kmval.validateForm(kmapp.loginuserchk_em))
		{ return false; }

	alert('login ok!');

	return false;
};

// This should not be in a generic js file that is loaded from all pages, but right now... blah
$(document).ready(function() {

	$('input[name="chkRegisterInvoice"]').on({
		click: function() {
					if ($(this).prop('checked')==true) {
						$('.divRegisterInvoice').show();
					} else {
						$('.divRegisterInvoice').hide();
					}
				}
	});

	$('#frmRegSubmit').off().on({
		click: function(e) {
			kmapp.registerUser(e);
		}
	});

	$('#frmLoginSubmit').off().on({
		click: function(e) {
			kmapp.loginUser(e);
		}
	});

});