window.CohortView = countlyView.extend({
    initialize:function () {
        this.filter = (store.get("countly_collectionfilter")) ? store.get("countly_collectionfilter") : "{}";
        this.limit = (store.get("countly_limitfilter")) ? store.get("countly_limitfilter") : 20;
    },
    beforeRender: function() {
        if(this.template)
            return $.when(countlyCohort.initialize()).then(function () {});
        else{
            var self = this;
            return $.when($.get(countlyGlobal["path"]+'/cohort/templates/cohort.html', function(src){
                self.template = Handlebars.compile(src);
            }),$.get(countlyGlobal["path"]+'/cohort/templates/select-modal.html', function(src){
                self.selectTemplate = Handlebars.compile(src);
            }), countlyCohort.initialize()).then(function () {});
        }
    },
    renderCommon:function (isRefresh) {
        var sessionData = countlySession.getSessionData(),
            userDP = countlySession.getUserDP();
        var self = this;
        console.log(countlyCohort.getElapsedInMS())
        this.templateData = {
            "page-title":jQuery.i18n.map["cohort.title"],
            "logo-class":"cohort",
            "execute-time":countlyCohort.getElapsedInMS()+""
        };
        if (!isRefresh) {
            $(this.el).html(this.template(this.templateData));
            countlyCohort.refreshData(function(){
                self.drawGraph();
            });
        }
    },
    refresh:function () {
       //don't refresh data.
    },
    submit:function(){
        var self = this;


        countlyCohort.refreshData(function(){
            if (app.activeView != self) {
                return false;
            }
            self.renderCommon(true);
            newPage = $("<div>" + self.template(self.templateData) + "</div>");

            $(self.el).find("#graph-header").replaceWith(newPage.find("#graph-header"));
            self.drawGraph();
        });

        app.localize();

    },
    afterRender:function(){

        var self = this;

        $(".selectable").click(clickSelectable);

        $(".addCondition").click(function(e){
            var $this= $(this);
            showOptions($(this),countlyCohort.getOptionList("dimensionCondition"),function(value){
                $option = $('<p>'+value+':<span class="btn" title="'+value+'" _name="'+value+'">'+value+'</span></p>');
                $option.find(".btn").click(clickOptional);
                $("#optional-condition").append($option);
                countlyCohort.addCondition(value);
            });
            e.stopPropagation();
        });
        $(".removeCondition").click(function(e){
            var $this= $(this);
            showOptions($(this),countlyCohort.getOptionList("dimensionCondition"),function(value){
                $this.text(value);
                countlyCohort.setValue(name,value);
            });
            e.stopPropagation();
        });
        $("#submit").click(function(){
            countlyCohort.setValue("fromDate",$("#fromDate").val());
            countlyCohort.setValue("toDate",$("#toDate").val());
            self.submit();
        })
        setDatePicker();


        function clickSelectable(e){
            var $this= $(this);
            var name = $this.attr("_name");

            showOptions($(this),countlyCohort.getOptionList(name),function(value){
                $this.text(value);
                countlyCohort.setValue(name,value);
            });
            e.stopPropagation();
        }

        function clickOptional(e){
            var $this= $(this);
            var name = $this.attr("_name");

            showOptions($(this),countlyCohort.getConditionOptionList(name),function(value){
                $this.text(value);
                countlyCohort.setConditionValue(name,value);
            });
            e.stopPropagation();
        }

        function showOptions($target,options,callback){

            var $modal = $(self.selectTemplate({options:options}));
            $('body').append($modal);
            var offset = $target.offset();
            $modal.css({
                "position":"fixed",
                "top":(offset.top+30)+"px",
                "left":offset.left
            });
            $modal.find(".option").click(function(e){
                callback($(this).text());
                $modal.remove();
                e.stopPropagation();
            })
            $(window).one("click",function(){
                $modal.remove();
            })

        }


        function setDatePicker(){
            $(window).click(function () {
                $("#my-date-picker").hide();
            });

            $("#my-date-picker").click(function (e) {
                e.stopPropagation();
            });
            $("#calendar-icon").click(function(e){
                $("#my-date-picker").toggle();

                if (self.dateToSelected) {
                    dateTo.datepicker("setDate", moment(self.dateToSelected).toDate());
                    dateFrom.datepicker("option", "maxDate", moment(self.dateToSelected).toDate());
                    //dateFrom.datepicker("option", "maxDate", moment(self.dateToSelected).subtract("days", 1).toDate());
                } else {
                    self.dateToSelected = new Date("2014-01-07").getTime();
                    dateTo.datepicker("setDate",new Date("2014-01-07"));
                    dateFrom.datepicker("option", "maxDate", moment(self.dateToSelected).toDate());
                }

                if (self.dateFromSelected) {
                    dateFrom.datepicker("setDate", moment(self.dateFromSelected).toDate());
                    dateTo.datepicker("option", "minDate", moment(self.dateFromSelected).toDate());
                } else {
                    extendDate = moment(dateTo.datepicker("getDate")).subtract('days', 6).toDate();
                    dateFrom.datepicker("setDate", extendDate);
                    self.dateFromSelected = moment(dateTo.datepicker("getDate")).subtract('days', 6).toDate().getTime();
                    dateTo.datepicker("option", "minDate", moment(self.dateFromSelected).toDate());
                }

                e.stopPropagation();
            });

            var dateTo = $("#my-date-to").datepicker({
                numberOfMonths:1,
                showOtherMonths:true,
                maxDate:moment().toDate(),
                onSelect:function (selectedDate) {
                    var instance = $(this).data("datepicker"),
                        date = $.datepicker.parseDate(instance.settings.dateFormat || $.datepicker._defaults.dateFormat, selectedDate, instance.settings),
                        dateCopy = new Date(date.getTime()),
                        fromLimit = dateCopy;//moment(dateCopy).subtract("days", 1).toDate();

                    // If limit of the left datepicker is less than the global we store in self
                    // than we should update the global with the new value
                    if (fromLimit.getTime() < self.dateFromSelected) {
                        self.dateFromSelected = fromLimit.getTime();
                    }

                    dateFrom.datepicker("option", "maxDate", fromLimit);
                    self.dateToSelected = date.getTime();
                }
            });

            var dateFrom = $("#my-date-from").datepicker({
                numberOfMonths:1,
                showOtherMonths:true,
                maxDate:moment().subtract('days', 1).toDate(),
                onSelect:function (selectedDate) {
                    var instance = $(this).data("datepicker"),
                        date = $.datepicker.parseDate(instance.settings.dateFormat || $.datepicker._defaults.dateFormat, selectedDate, instance.settings),
                        dateCopy = new Date(date.getTime()),
                        toLimit = dateCopy;//moment(dateCopy).add("days", 1).toDate();

                    // If limit of the right datepicker is bigger than the global we store in self
                    // than we should update the global with the new value
                    if (toLimit.getTime() > self.dateToSelected) {
                        self.dateToSelected = toLimit.getTime();
                    }

                    dateTo.datepicker("option", "minDate", toLimit);
                    self.dateFromSelected = date.getTime();
                }
            });

            $.datepicker.setDefaults($.datepicker.regional[""]);
            $("#my-date-to").datepicker("option", $.datepicker.regional[countlyCommon.BROWSER_LANG]);
            $("#my-date-from").datepicker("option", $.datepicker.regional[countlyCommon.BROWSER_LANG]);

            $("#my-date-submit").click(function () {
                if (!self.dateFromSelected && !self.dateToSelected) {
                    return false;
                }
                console.log(moment(self.dateFromSelected).toDate().format("yyyy-mm-dd"));
                var fromDate = moment(self.dateFromSelected).toDate().format("yyyy-mm-dd");
                var toDate = moment(self.dateToSelected).toDate().format("yyyy-mm-dd");
                $("#fromDate").val(fromDate);
                $("#toDate").val(toDate);
                countlyCohort.setValue("fromDate",fromDate);
                countlyCohort.setValue("toDate",toDate);
                $("#my-date-picker").hide();
            });
        }

    },
    drawGraph:function(){
        var cohorts = countlyCohort.getCohorts();

        var type="line";
        var ticksLabel;
        var dataPoints={dp:[]};
        $.each(cohorts,function(index,cohort){
            var cm = cohort.cohortMetrics;
            var dataList=[];
            for(var i in cm ){
                dataList.push([i,cm[i]]);
            }

            dataPoints.dp.push({
                data:dataList,
                label:cohort.cohortId
            })
        });
        var inGraphProperties={
            series:{
                lines:{ stack:false, show:true, fill:true, lineWidth:2, fillColor:{ colors:[
                    { opacity:0 },
                    { opacity:0.15 }
                ] }, shadowSize:0 },
                points:{ show:true, radius:4, shadowSize:0 },
                shadowSize:0
            },
            xaxis:{
                max:9,
                min:0,
                ticks:[
                    [1,"1"],[2,"2"],[3,"3"],[4,"4"],[5,"5"],[6,"6"],[7,"7"]
                ]
            }
        };

        countlyCommon.drawGraph(dataPoints, "#dashboard-graph",type,inGraphProperties);

    }
});




//register views
app.cohortView = new CohortView();


app.route("/analytics/cohort", 'cohort', function () {
	this.renderWhenReady(this.cohortView);
});


$( document ).ready(function() {

    if(countlyGlobal["member"].global_admin){
        var menu = '<a href="#/analytics/cohort" class="item">'+
            '<div class="logo-icon fa fa-line-chart"></div>'+
            '<div class="text" data-localize="cohort.title"></div>'+
            '</a>';
        $('#analytics-submenu').append(menu);
    }
});

//dateFormat tool
var dateFormat = function () {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
        timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
        timezoneClip = /[^-+\dA-Z]/g,
        pad = function (val, len) {
            val = String(val);
            len = len || 2;
            while (val.length < len) val = "0" + val;
            return val;
        };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date;
        if (isNaN(date)) throw SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var _ = utc ? "getUTC" : "get",
            d = date[_ + "Date"](),
            D = date[_ + "Day"](),
            m = date[_ + "Month"](),
            y = date[_ + "FullYear"](),
            H = date[_ + "Hours"](),
            M = date[_ + "Minutes"](),
            s = date[_ + "Seconds"](),
            L = date[_ + "Milliseconds"](),
            o = utc ? 0 : date.getTimezoneOffset(),
            flags = {
                d:    d,
                dd:   pad(d),
                ddd:  dF.i18n.dayNames[D],
                dddd: dF.i18n.dayNames[D + 7],
                m:    m + 1,
                mm:   pad(m + 1),
                mmm:  dF.i18n.monthNames[m],
                mmmm: dF.i18n.monthNames[m + 12],
                yy:   String(y).slice(2),
                yyyy: y,
                h:    H % 12 || 12,
                hh:   pad(H % 12 || 12),
                H:    H,
                HH:   pad(H),
                M:    M,
                MM:   pad(M),
                s:    s,
                ss:   pad(s),
                l:    pad(L, 3),
                L:    pad(L > 99 ? Math.round(L / 10) : L),
                t:    H < 12 ? "a"  : "p",
                tt:   H < 12 ? "am" : "pm",
                T:    H < 12 ? "A"  : "P",
                TT:   H < 12 ? "AM" : "PM",
                Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
            };

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
}();

// Some common format strings
dateFormat.masks = {
    "default":      "ddd mmm dd yyyy HH:MM:ss",
    shortDate:      "m/d/yy",
    mediumDate:     "mmm d, yyyy",
    longDate:       "mmmm d, yyyy",
    fullDate:       "dddd, mmmm d, yyyy",
    shortTime:      "h:MM TT",
    mediumTime:     "h:MM:ss TT",
    longTime:       "h:MM:ss TT Z",
    isoDate:        "yyyy-mm-dd",
    isoTime:        "HH:MM:ss",
    isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
    dayNames: [
        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ],
    monthNames: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ]
};

// For convenience...
Date.prototype.format = function (mask, utc) {
    return dateFormat(this, mask, utc);
};


