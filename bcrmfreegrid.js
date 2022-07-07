//Globals
//Enable PR
var BCRM_ENABLE_FREE_GRID_PR = true;

//Applet Configuration Examples
//Override repository definition (control sequence and form sections) with JSON
//Could read this from JSON, REST, Business Service etc
var BCRMFreeGridConfig = {
    "SIS Product Form Applet - ISS Admin__ISS Product Administration View": {
        "free": { "seq": 0, "id": "free", "caption": "General", "fields": ["Type", "Name"] },//,"Organization","Orderable","Description","Version Status","Product Line","IsComplexProductBundle","Part #","Unit of Measure","IsComplexProductNotBundle","Payment Type","Product Def Type Code","Track As Asset Flag","Inventory Flag","Product Level","Maximum Quantity","Equivalent Product","Format","CDA Pageset","ThumbnImageFileName","Parent Internal Product Name","Start Date","Thumbnail Source Path","Network Element Type","End Date","ImageFileName","SPN Definition Name","Compound Flag","Image Source Path"]},
        "HTML_FormSection2_Label": { "caption": "Marketing Info", "seq": 2, "id": "HTML_FormSection2_Label", "fields": ["Targeted Industry", "Targeted Min Age"] },//,"Targeted Postal Code","Targeted Country","Targeted Max Age"]},
        "HTML_FormSection4_Label": { "caption": "Service", "seq": 2, "id": "HTML_FormSection4_Label", "fields": ["MTBF", "MTTR", "Field Replacable Unit", "Return if Defective", "Tool Flag", "Billing Type", "Billing Service Type"] },
        "HTML_FormSection3_Label": { "caption": "Logistics", "seq": 3, "id": "HTML_FormSection3_Label", "fields": ["Vendor", "Vendor Location", "Vendor Part Number", "Item Size", "Lead Time", "Carrier", "Shipping Method", "Allocate Below Safety Flag", "Auto Substitute  Flag", "Auto Allocate Flag", "Auto Explode Flag"] },
        "HTML_FormSection5_Label": { "caption": "Other", "seq": 4, "id": "HTML_FormSection5_Label", "fields": ["SAP Division Code", "Integration Id", "Global Product Identifier", "Serialized", "Configuration", "Taxable Flag", "Tax Subcomponent Flag", "Position Bill Product Flag", "Inclusive Eligibility Flag", "Compensatable"] }
    },
    "Contact Form Applet__default": {
        "free": { "seq": 0, "id": "free", "caption": "General", "fields": ["First Name", "Last Name", "M/M", "Job Title"] },
        "section0": { "seq": 1, "id": "section0", "caption": "<span></span><i>" + "Contact Info" + "</i></span>", "fields": ["Email Address", "Work Phone #", "Cellular Phone #"] },
        "section1": { "seq": 2, "id": "section1", "caption": "Company & Address", "fields": ["Account", "Account Location", "Personal Street Address", "Personal City", "Personal State", "Personal Postal Code", "Personal Country"] }
    },
    "SIS Account Entry Applet__default": {
        "free": { "seq": 0, "id": "free", "caption": "General", "fields": ["Name", "Location", "City"] },
        "section0": { "seq": 1, "id": "section0", "caption": "Account Details", "fields": ["Sales Rep", "Main Phone Number"] },
        "section1": { "seq": 2, "id": "section1", "caption": "Address", "fields": ["Street Address", "State", "Postal Code", "Country"] }
    },
    "Contact Form Applet - Child__Contact Details View (Detail tab)": {
        "free": { "seq": 0, "id": "free", "caption": "General", "fields": ["First Name", "Last Name", "Status", "Home Phone #", "Disable DataCleansing", "Middle Name", "Households", "Work Phone #", "Household Status", "Work Phone Extension", "PIM Current User Sync Flag", "M/F", "Account", "Alternate Phone #", "Assignment Excluded", "Suppress All Calls", "Account Status", "Alternate Email Address", "Employee Flag", "Suppress All Emails", "Sales Rep", "Assistant", "Suppress All Mailings", "S-S Instance", "Assistant Phone #", "Preferred Communications", "Organization", "Manager Last Name", "Mail Stop", "Email SR Updates Flag", "Registration Source App Name", "Manager First Name", "Time Zone Name - Translation", "Comment", "Price List"] }
    }
};

//Utility Functions
//These should be in a separate file
BCRMGetAppletType = function (pm) {
    try {
        var retval = false;
        var type = null;
        var id = null;
        var an;
        if (typeof (pm.Get) !== "function") {
            throw ("Invalid PM");
        }
        if (pm) {
            an = pm.GetObjName();
            if (typeof (pm.Get) === "function") {
                if (pm.Get("GetListOfColumns")) {
                    retval = "list";
                    type = true;
                }
            }
            id = pm.Get("GetFullId");
            if ($("#" + id).find(".siebui-tree").length != 0) { //it's a tree!
                retval = "tree";
                type = true;
            }
            else if (!type) {  //finding out whether it's a chart applet is tricky...
                id = pm.Get("GetFullId").split("_")[1]; //chart applets have weird Ids
                id = id.toLowerCase().charAt(0) + "_" + id.charAt(1);  //did I mention that they have weird Ids
                if ($("#" + id).find(".siebui-charts-container").length != 0) {
                    retval = "chart"; //It's a Bingo! -- Do you say it like that? -- No, you just say 'Bingo!'.
                }
                else { //no list,tree or chart. 99% sure it's a form applet
                    retval = "form";
                }
            }
        }
        else {//not of this world...
            retval = "unknown"
        }
        return retval;
    }
    catch (e) {
        console.log("BCRMGetAppletType: Error while processing Applet '" + an + "': " + e.toString());
    }
};

BCRMGetLabelElem = function (c, pm) {
    try {
        if (typeof (pm.Get) !== "function") {
            throw ("Invalid PM");
        }
        var an, tp, pr, fi, ce, li, ae, inpname, gh, ph, ch, cm, fn, cn, uit, thelabel;
        var retval = null;
        if (pm) {
            an = pm.GetObjName();
            fi = pm.Get("GetFullId");
            tp = BCRMGetAppletType(pm);
            pr = pm.GetRenderer();
            ae = $("#" + fi);
            uit = c.GetUIType();
            inpname = c.GetInputName();
            if (tp == "form" && pr.GetUIWrapper(c)) {
                //get control element
                ce = pr.GetUIWrapper(c).GetEl();
                //first attempt: get by label id
                li = $(ce).attr("aria-labelledby");

                //20.10 or higher have applet id appended to label
                //use "begins with" logic seems to do the trick
                //needs more testing
                thelabel = ae.find("span[id^='" + li + "']");

                //second attempt: try with text
                if (thelabel.length == 0) {
                    li = $(ce).attr("aria-label");
                    ae.find("span:contains('" + li + "')").each(function (x) {
                        if ($(this).text() == li) {
                            thelabel = $(this);
                        }
                    })
                }

                //third attempt: use tag from previous runs
                if (thelabel.length == 0) {
                    li = inpname;
                    thelabel = ae.find("[bcrm-label-for='" + li + "']");
                }

                if (uit == "Button") {
                    thelabel = ae.find("[name='" + inpname + "']");
                }

                //check if label has been found
                if (thelabel.length == 1) {
                    //tag the label
                    thelabel.attr("bcrm-label-for", inpname);
                    retval = thelabel;
                }
            }

            //for list applets, return the column header
            if (tp == "list" && typeof (c) !== "undefined") {
                gh = ae.find("table.ui-jqgrid-htable");
                ph = pm.Get("GetPlaceholder");
                ch = pr.GetColumnHelper();
                cm = ch.GetColMap();
                fn = c.GetName();
                for (col in cm) {
                    if (cm[col] == fn) {
                        cn = col;
                    }
                }
                li = "div#jqgh_" + ph + "_" + cn;
                thelabel = gh.find(li);

                if (uit == "Button") {
                    thelabel = ae.find("[name='" + inpname + "']");
                }

                if (thelabel.length == 1) {
                    retval = thelabel;
                }
            }
            return retval;
        }
    }
    catch (e) {
        console.log("BCRMGetLabelElem: Error while processing Applet '" + an + "': " + e.toString());
    }
};

BCRMClassify = function (pm) {
    try {
        var an;
        if (typeof (pm.Get) !== "function") {
            throw ("Invalid PM");
        }
        an = pm.GetObjName();
        var vn = SiebelApp.S_App.GetActiveView().GetName();
        var fi = pm.Get("GetFullId");
        var bc = pm.Get("GetBusComp").GetName();
        var ae = $("#" + fi);
        var cs = pm.Get("GetControls");
        var pr = pm.GetRenderer();
        var rrs = pm.Get("GetRawRecordSet");
        var sel = pm.Get("GetSelection");
        var r = rrs[sel];
        var cel, fn, val;

        //tag the view
        $("#_sweview").attr("bcrm_view", vn.replace(/\W/g, ""));

        //tag the applet
        ae.attr("bcrm_applet", an.replace(/\W/g, ""));
        ae.attr("bcrm_bc", bc.replace(/\W/g, ""));

        //tag the controls
        for (c in cs) {
            fn = cs[c].GetFieldName();
            if (fn != "") {
                val = r[fn];
                if (val == "" || typeof (val) === "undefined") {
                    val = "_null_";
                }
                cel = pr.GetUIWrapper(cs[c]).GetEl();
                if (typeof (cel) !== "undefined") {
                    cel.parent().attr("bcrm_field", fn.replace(/\W/g, ""));
                    cel.parent().attr("bcrm_value", val.replace(/\W/g, "").substring(0, 30));

                    //propagate to bcrm-new-grid if present
                    if (cel.parent().parent().hasClass("bcrm-new-grid-wrap")) {
                        cel.parent().parent().attr("bcrm_field", fn.replace(/\W/g, ""));
                        cel.parent().parent().attr("bcrm_value", val.replace(/\W/g, "").substring(0, 30));
                    }
                }
            }
        }
    }
    catch (e) {
        console.log("BCRMClassify: Error while processing Applet '" + an + "': " + e.toString());
    }
}

BCRMAddAppletButton = function (pm, btn, func) {
    try {
        var an;
        if (typeof (pm.Get) !== "function") {
            throw ("Invalid PM");
        }
        an = pm.GetObjName();
        var fi = pm.Get("GetFullId");
        var ae = $("#" + fi);
        var bg = ae.find(".siebui-btn-grp-applet");
        bg.prepend(btn);
        btn.on("click", func);
    }
    catch (e) {
        console.log("BCRMAddAppletButton: Error while processing Applet '" + an + "': " + e.toString());
    }
};

//BCRM Free Grid functions
//Get applet config from JSON or by parsing the current grid layout in the DOM
BCRMFreeGridGetConfig = function (pm) {
    try {
        let fi = pm.Get("GetFullId");
        let ae = $("#" + fi);
        let cs = pm.Get("GetControls");
        let formsections = {};
        let colpos = 0;
        let rowpos = 0;
        let seq = 1;
        let an = pm.GetObjName();
        let vn = SiebelApp.S_App.GetActiveView().GetName();
        let cname = an + "__" + vn;
        let dname = an + "__default";
        let tname = an + "__";
        let useconf = "none";
        let appletconfig;
        let hasconfig = false;
        let fs_sel = ".FormSection"; //selector for form sections, for easy replacement
        let field_sel = ".mceGridField"; //selector for grid layout controls/fields (not labels)
        let tb = ae.find("table.GridBack");

        appletconfig = BCRMFreeGridConfig[cname];
        if (typeof (appletconfig) === "undefined") {
            appletconfig = BCRMFreeGridConfig[tname];
        }
        else {
            useconf = cname;
        }
        if (typeof (appletconfig) === "undefined") {
            appletconfig = BCRMFreeGridConfig[dname];
        }
        else {
            useconf = tname;
        }
        if (typeof (appletconfig) !== "undefined") {
            hasconfig = true;
            if (useconf == "none") {
                useconf = dname;
            }
        }

        //if we do not have a configuration, we must parse the applet in the DOM
        if (!hasconfig) {
            //first pass: markup TR and TD elements and collect formsection info
            tb.find("tr").each(function (i) {
                $(this).attr("data-rowpos", rowpos);
                $(this).find("td").each(function (j) {
                    //set attributes for each TD
                    $(this).attr("data-colpos", colpos);
                    $(this).attr("data-top", $(this).offset().top);
                    $(this).attr("data-left", $(this).offset().left);
                    $(this).attr("data-width", $(this).width());
                    if (j > 0) { colpos++; }

                    if ($(this).find(fs_sel).length > 0) {
                        //if TD hosts a formsection, collect its info into a temp object
                        var td = $(this);
                        var fslbl = td.find("span").attr("id");//td.find(fs_sel).text();
                        var colspan = parseInt(td.attr("colspan"));
                        formsections[fslbl] = {};
                        formsections[fslbl]["caption"] = td.find(fs_sel).text();
                        formsections[fslbl]["seq"] = seq;
                        formsections[fslbl]["id"] = td.find("span").attr("id");
                        formsections[fslbl]["fields"] = [];
                        seq++;
                        colpos += colspan;
                    }
                });
                colpos = 0;
                rowpos++;
                //add "free" formsection
                formsections["free"] = { "seq": 0, "id": "free", "caption": "General", "fields": [] };
            });

            if (seq == 1) {
                //applet repo definition has no formsections, but custom config could have
                if (hasconfig) {
                    for (acf in appletconfig) {
                        if (acf != "free") {
                            seq++;
                        }
                    }
                }
            }
            //2nd pass
            //for each td with an input, "look up" (literally) to which formsection it belongs to
            tb.find("td").each(function (i) {
                var td = $(this);
                if (td.find(fs_sel).length == 0 && td.find(field_sel).length == 1) {  //only include inputs
                    var r = parseInt(td.parent("tr").attr("data-rowpos"));
                    var cushion = 5;
                    var left = parseInt(td.attr("data-left")) + cushion;
                    var fid = "";
                    for (var ri = r; ri >= 0; ri--) {
                        //go up until we find the formsection
                        var tr = tb.find("tr[data-rowpos='" + ri + "']");
                        tr.find("td").each(function (j) {
                            var tdi = $(this);
                            if (tdi.find(fs_sel).length == 1 && fid == "") {
                                var fstart = parseInt(tdi.attr("data-left"));
                                var fend = fstart + parseInt(tdi.attr("data-width"));
                                if (fstart <= left && left <= fend) { //if left (plus cushion) side of control is within the formsection's boundaries
                                    fid = tdi.find("span").attr("id"); //get the formsection id
                                }
                            }
                        });
                    }
                    if (fid != "") {  //mark each control TD with the formsection id it appears under
                        if (typeof (td.attr("data-fid")) === "undefined") {
                            td.attr("data-fid", fid);
                        }

                    }
                    else {   //control could be "free" , ie not under any formsection
                        fid = "free";
                        td.attr("data-fid", fid);
                    }

                    if (!hasconfig) { //write field list to formsection
                        var inputname = $(td.find(field_sel).children()[0]).attr("name");
                        if (typeof (inputname) !== "undefined") {
                            for (c in cs) {
                                if (cs[c].GetInputName() == inputname) {
                                    formsections[fid]["fields"].push(cs[c].GetFieldName());
                                }
                            }
                        }
                    }
                    fid = "";
                }
            });
        }
        //use current layout as config if no custom config is present
        if (!hasconfig) {
            appletconfig = formsections;
        }
        return appletconfig;
    }
    catch (e) {
        console.log("BCRMFreeGridGetConfig: Error while processing Applet '" + an + "': " + e.toString());
    }
};

BCRMFreeGridGetNewGrid = function (pm, appletconfig) {
    try {
        //create sections and collect controls
        let acconf = {
            collapsible: true,
            active: false,
            heightStyle: "content"
        };
        let fi = pm.Get("GetFullId");
        let an = pm.GetObjName();
        let ae = $("#" + fi);
        let cs = pm.Get("GetControls");
        let lbl = [];
        let fld = [];
        let lblid = "";
        let newgriddiv = $("<div id='bcrm_new_grid' class='bcrm-new-grid'></div>");  //the top container for the "new" grid, replacing the table
        let wrapdiv = "<div class='bcrm-new-grid-wrap' style='border: 1px solid transparent; margin:6px 8px 0px 0px;'></div>"; //container for individual labels/controls
        let cwrapdiv = "<div id='bcrm_section_container' class='bcrm-new-grid-sc'></div>"; //container for new formsections
        let field_sel = ".mceGridField"; //selector for grid layout controls/fields (not labels)
        let wrapcount = 0;
        let fieldlist = [];
        let iname = "";
        let lbltxt = "";
        var hints;
        //get section items
        var cwrap = $(cwrapdiv);
        var seq = 0;
        for (f in appletconfig) {
            if (appletconfig[f]["seq"] >= 0) {
                if (appletconfig[f]["seq"] > seq) {
                    seq = appletconfig[f]["seq"];
                }
            }
        }
        seq++;
        for (var k = 0; k < seq; k++) {
            for (f in appletconfig) {
                if (appletconfig[f]["seq"] == k) {
                    fieldlist = appletconfig[f]["fields"];
                    hints = appletconfig[f]["hints"];
                    var fsec = $("<h3 id='" + appletconfig[f]["id"] + "'>" + appletconfig[f]["caption"] + "</h3><div></div>");
                    for (fx = 0; fx < fieldlist.length; fx++) {
                        fname = fieldlist[fx];
                        for (c in cs) {
                            if (cs[c].GetFieldName() == fname) {
                                cel = pm.GetRenderer().GetUIWrapper(cs[c]).GetEl();
                                if (typeof (cel) !== "undefined" && $(cel).parent(".siebui-applet-title").length == 0) {
                                    iname = cs[c].GetInputName();
                                    lblid = $(cel).attr("aria-labelledby");
                                    lbltxt = $(cel).attr("aria-label");
                                    break;
                                }
                            }
                        }
                        thefield = ae.find("[name='" + iname + "']").parent(field_sel);
                        wrap = $(wrapdiv);
                        wrap.attr("id", "wrap" + wrapcount);
                        wrapcount++;
                        if (fld.length == 0) {
                            if (thefield.length > 0) {
                                if (typeof (lblid) === "undefined") {
                                    //dig deeper for a label id
                                    thefield.children().each(function (z) {
                                        if (typeof ($(this).attr("aria-labelledby")) !== "undefined") {
                                            lblid = $(this).attr("aria-labelledby");
                                        }
                                    });
                                }
                                //leave a mark
                                if (thefield.parent().find("span[id='bcrm_field']").length == 0) {
                                    thefield.after("<span id='bcrm_field' data-iname='" + iname + "'></span>");
                                }
                                fld = thefield;
                            }
                        }
                        if (lbl.length == 0) {
                            if (lblid != "") {
                                var lblelem = BCRMGetLabelElem(cs[c], pm);
                                if (lblelem) {
                                    lbl = lblelem.parent()[0];
                                    if (typeof (lbl) === "undefined") { //work around misconfigured labels
                                        lbl = $(ae).find("div.mceGridLabel:contains('" + lbltxt + "')")[0];
                                    }
                                    //leave a mark
                                    if ($(lbl).parent().find("span[id='bcrm_label']").length == 0) {
                                        $(lbl).after("<span id='bcrm_label' data-iname='" + iname + "'></span>");
                                    }
                                    lbl = $(lbl);
                                }
                            }
                            //hints
                            if (typeof (hints) !== "undefined") {
                                for (h = 0; h < hints.length; h++) {
                                    var hi = hints[h];
                                    var ht = "";
                                    if (typeof (hi[fname]) !== "undefined") {
                                        ht = hi[fname];
                                    }
                                    if (ht != "") {
                                        $(lbl).attr("data-hint", ht);
                                        $(lbl).attr("data-hintposition", "top-middle");
                                    }
                                }
                            }
                        }
                        if (lbl.length == 1) {
                            lbl = $(lbl).detach();
                            lbl.attr("data-iname", iname);
                            lbl.attr("data-btype", "bcrm_label");
                            wrap.append(lbl);
                        }
                        if (fld.length == 1) {
                            fld = thefield.detach();
                            fld.attr("data-iname", iname);
                            fld.attr("data-btype", "bcrm_field");
                            //elevate classification if available
                            if (typeof (fld.attr("bcrm_field")) !== "undefined") {
                                wrap.attr("bcrm_field", fld.attr("bcrm_field"));
                                wrap.attr("bcrm_value", fld.attr("bcrm_value"));
                            }
                            wrap.append(fld);
                            $(fsec[1]).append(wrap);
                        }
                        lbl = [];
                        fld = [];
                        lblid = "";
                        fname = "";
                        thefield = null;
                        iname = "";
                    }
                }
                if ($(fsec).find(".bcrm-new-grid-wrap").length > 0) {
                    cwrap.append(fsec);
                }
            }
        }
        $(newgriddiv).append(cwrap);
        $(newgriddiv).find("#bcrm_section_container").accordion(acconf);
        return $(newgriddiv);
    }
    catch (e) {
        console.log("BCRMFreeGridGetNewGrid: Error while processing Applet '" + an + "': " + e.toString());
    }
};

BCRMToggleEmptyFields = function () {
    var an = $(this).attr("bcrm-applet");
    var am = SiebelApp.S_App.GetActiveView().GetAppletMap();
    var pm = am[an].GetPModel();
    var fi = pm.Get("GetFullId");
    var ae = $("#" + fi);
    if ($(this).text() == "Hide Empty Fields") {
        ae.find(".bcrm-new-grid-wrap[bcrm_value='_null_']").hide();
        $(this).text("Show Empty Fields");
    }
    else {
        ae.find(".bcrm-new-grid-wrap[bcrm_value='_null_']").show();
        $(this).text("Hide Empty Fields");
    }
};

BCRMExpandAccordion = function () {
    var an = $(this).attr("bcrm-applet");
    var am = SiebelApp.S_App.GetActiveView().GetAppletMap();
    var pm = am[an].GetPModel();
    var fi = pm.Get("GetFullId");
    var ae = $("#" + fi);
    if ($(this).text() == "Expand All") {
        ae.find(".ui-accordion-content").show();
        $(this).text("Collapse All");
    }
    else {
        ae.find(".ui-accordion-content").hide();
        $(this).text("Expand All");
    }
};

//Main function, call in form applet PR or from elsewhere
BCRMFreeGridMain = function (pm, exp) {
    try {
        //export applet config, see end of function
        if (typeof (exp) === "undefined") {
            exp = false;
        }
        if (typeof (pm.Get) !== "function") {
            throw ("Invalid PM");
        }
        let fi = pm.Get("GetFullId");
        let ae = $("#" + fi);
        let tb = ae.find("table.GridBack");
        let an = pm.GetObjName();
        let vn = SiebelApp.S_App.GetActiveView().GetName();
        let cname = an + "__" + vn;

        //start
        BCRMClassify(pm);
        var appletconfig = BCRMFreeGridGetConfig(pm);
        var newgriddiv = BCRMFreeGridGetNewGrid(pm, appletconfig);
        newgriddiv.hide();
        //insert responsive grid
        tb.before(newgriddiv);

        //hide original table
        tb.hide();

        //post-conversion tasks (styles, overrides)
        setTimeout(function () {
            ae.find("#bcrm_section_container").find("h3").each(function (i) {
                ae.find("#bcrm_section_container").accordion("option", "active", i);
                $(this).find("span.ui-accordion-header-icon").css("line-height", "1.5");
            });
            ae.find("#bcrm_section_container").accordion("option", "active", 0);
            if (ae.find("#bcrm_section_container").find("h3").length == 1) {
                ae.find("#bcrm_section_container").find("h3").hide();
            }
            ae.find("#bcrm_new_grid").show();
        }, 100);

        //add buttons
        BCRMAddAppletButton(pm, $("<button bcrm-applet='" + an + "' class='bcrm-new-grid-button'>Hide Empty Fields</button>"), BCRMToggleEmptyFields);
        if (ae.find("#bcrm_section_container").find("h3").length > 1) {
            BCRMAddAppletButton(pm, $("<button bcrm-applet='" + an + "' class='bcrm-new-grid-button'>Expand All</button>"), BCRMExpandAccordion);
        }

        //export applet config JSON to string if requested
        if (exp) {
            var x = {};
            x[cname] = appletconfig;
            //SiebelApp.Utils.Prompt("Copy Applet Configuration to Clipboard", JSON.stringify(x));
            console.log(JSON.stringify(x));
        }
    }
    catch (e) {
        console.log("BCRMFreeGridMain: Error while processing Applet '" + an + "': " + e.toString());
    }
};

if (BCRM_ENABLE_FREE_GRID_PR) {
    if (typeof (SiebelAppFacade.BCRMFreeGridPR) === "undefined") {

        SiebelJS.Namespace("SiebelAppFacade.BCRMFreeGridPR");
        define("siebel/custom/bcrmfreegrid", ["siebel/phyrenderer"],
            function () {
                SiebelAppFacade.BCRMFreeGridPR = (function () {

                    function BCRMFreeGridPR(pm) {
                        SiebelAppFacade.BCRMFreeGridPR.superclass.constructor.apply(this, arguments);
                    }

                    SiebelJS.Extend(BCRMFreeGridPR, SiebelAppFacade.PhysicalRenderer);

                    BCRMFreeGridPR.prototype.Init = function () {
                        SiebelAppFacade.BCRMFreeGridPR.superclass.Init.apply(this, arguments);
                        this.AttachPMBinding("FieldChange", this.CallCustomHandlers, { sequence: true, scope: this });
                        this.AttachPMBinding("ShowSelection", this.CallCustomHandlers, { sequence: true, scope: this });
                    }

                    BCRMFreeGridPR.prototype.ShowUI = function () {
                        SiebelAppFacade.BCRMFreeGridPR.superclass.ShowUI.apply(this, arguments);
                    }

                    BCRMFreeGridPR.prototype.BindData = function (bRefresh) {
                        SiebelAppFacade.BCRMFreeGridPR.superclass.BindData.apply(this, arguments);
                        //call main functions
                        var pm = this.GetPM();
                        BCRMClassify(pm);
                        BCRMFreeGridMain(this.GetPM());
                    }

                    BCRMFreeGridPR.prototype.BindEvents = function () {
                        SiebelAppFacade.BCRMFreeGridPR.superclass.BindEvents.apply(this, arguments);
                    }

                    BCRMFreeGridPR.prototype.EndLife = function () {
                        SiebelAppFacade.BCRMFreeGridPR.superclass.EndLife.apply(this, arguments);
                    }

                    BCRMFreeGridPR.prototype.CallCustomHandlers = function () {
                        BCRMClassify(this.GetPM());
                    }

                    return BCRMFreeGridPR;
                }()
                );
                return "SiebelAppFacade.BCRMFreeGridPR";
            })
    }
}