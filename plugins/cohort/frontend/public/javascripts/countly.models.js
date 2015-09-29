(function (countlyCohort, $, undefined) {
    //Private Properties
    var _data ={};

    var _dataSource="gamecohort";
    var _appKey ="25a03f9f3557a2305744262f25245583";
    var _metric="";
    var _eventA="";
    var _eventB="";
    var _interval="";
    var _dimension="";
    var _dimensionCondition={};
    var _metaData={};

    var _fromDate="2014-01-01";
    var _toDate="2014-01-09";
    var _rangeFrom = "1";
    var _rangeTo = "7";

    var _cohorts=[];
    var _elapsedInMS="";

    //Public Methods
    countlyCohort.initialize = function () {
        $.getScript(countlyGlobal['path']+'/cohort/javascripts/yaml.min.js').done(function() {
            $.get(countlyGlobal["path"] + '/cohort/data/dimensions.yaml', function (src) {
                _metaData = YAML.parse(src);
                console.log(_metaData);
            });
        });
    };


    countlyCohort.getData = function () {
        return _data;
    };
    countlyCohort.getCohorts = function(){
        return _cohorts;
    }
    countlyCohort.getElapsedInMS = function(){
        return _elapsedInMS;
    }

    countlyCohort.getOptionList = function(name){
        switch(name){
            case "metric":
                return  ["Retention", "Per User Activity Count", "Per User Activity Sum", "Per User Revenue"];
            case "eventA":
                if(_metric.indexOf("Revenue") > 0) {
                    return ["In-App Purchase"];
                }else{
                    return ["Launch", "In-App Purchase", "Install", "Won", "Lost"];
                }
            case "eventB":
                return  ["Installation", "Launch", "In-App Purchase", "GameSession", "Won", "Lost"];
            case "interval":
                return  ["Day","Week"];
            case "dimension":
                return  ["Day","Week"];
            case "dimensionCondition":
                var finalList=[];
                var totalList=["AppVersion","Country","Device"];
                for(var index in totalList){
                    var dimension= totalList[index]
                    if(_dimensionCondition[dimension]==undefined){
                        finalList.push(dimension);
                    }
                }
                return  finalList;
            default:
                return [];
        }

    }

    countlyCohort.setValue=function(name,value){
        switch(name){
            case "metric":
                _metric=value;
                break;
            case "eventA":
                _eventA=value;
                break;
            case "eventB":
                _eventB=value;
                break;
            case "interval":
                _interval=value;
                break;
            case "dimension":
                _dimension=value;
                break;
            case "fromDate":
                _fromDate=value;
                break;
            case "toDate":
                _toDate = value;
                break;
            case "rangeFrom":
                _rangeFrom = value;
                break;
            case "rangeTo":
                _rangeTo = value;
                break;
            default:
                break;
        }

    }
    countlyCohort.getValue=function(name){
        switch(name){
            case "metric":
                return  _metric;
            case "eventA":
                return _eventA;
            case "eventB":
                return _eventB;
            case "interval":
                return _interval;
            case "dimension":
                return _dimension;
            case "fromDate":
                return _fromDate;
            case "toDate":
                return _toDate;
            case "rangeFrom":
                return _rangeFrom;
            case "rangeTo":
                return _rangeTo;
            default:
                return;
        }
    }

    countlyCohort.getConditionOptionList = function(name) {

        if(name === "AppVersion"){
            return ["1.0","1.5","2.0","2.2","3.0"];

        }else if(name === "Country"){
            return ["China","Singapore","America","Other"];

        }else if(name === "Device"){
            return  ['Kindle Fire HDX', 'iPad Air', 'iPhone 5C', 'One S', 'Fire Phone', 'Nexus 4', 'Galaxy Note', 'iPhone 6', 'Nexus 7', 'iPad 4', 'iPhone 4S', 'iPhone Mini', 'One Touch Idol X', 'iPhone 5', 'Optimus L5', 'Nexus 10', 'Nexus 5', 'Lumia 920', 'Windows Phone', 'Xperia Z'];
        }

    }

    countlyCohort.addCondition = function(name){
        _dimensionCondition[name]='';
    }
    countlyCohort.setConditionValue=function(name,value) {
        _dimensionCondition[name]=value;
    }
    countlyCohort.getConditionValue=function(name) {
        return _dimensionCondition[name];
    }
    countlyCohort.refreshData=function(callback){
        var query = buidQuery();
        $.ajax({
            type:"GET",
            url:countlyCommon.API_PARTS.data.r,
            data:{
                "api_key":countlyGlobal.member.api_key,
                "app_id":countlyCommon.ACTIVE_APP_ID,
                "method":"cohort",
                "query":JSON.stringify(query)
            },
            dataType:"jsonp",
            success:function (data) {
                if(data.status=="OK"){
                    _cohorts = data.result.cohorts;
                    _elapsedInMS = data.elapsedInMS;
                    callback();
                }else{
                    alert("can't get data");
                }
            }
        });

    }
    function buidQuery(){
/*
        var query ={
            "dataSource" : "gamecohort",
            "appKey" : "c907ad335af73a664796f00bc4f17948",
            "metric" : "Retention",
            "since" : "LaunchDay",
            "rowFields" : [ "LaunchDay" ],
            "rowFilters" : [ {
                "values" : [ "2014-01-01|2014-01-09" ],
                "filterType" : "Range",
                "cubeField" : "LaunchDay"
            }, {
                "values" : [ "iPhone 6" ],
                "filterType" : "Set",
                "cubeField" : "Device"
            } ],
            "columnField" : "DayAge",
            "columnFilters" : [ {
                "values" : [ "Won" ],
                "filterType" : "Set",
                "cubeField" : "AfterEvent"
            }, {
                "values" : [ "1|7" ],
                "filterType" : "Range",
                "cubeField" : "DayAge"
            } ]
        }
        */
        var rowFilters =[{
            "values" : [ _fromDate+"|"+_toDate],
            "filterType" : "Range",
            "cubeField" : _eventB+"Day"
        }
        ]
        if(_dimensionCondition["Device"]){
            rowFilters.push({
                "values" : [ _dimensionCondition["Device"] ],
                "filterType" : "Set",
                "cubeField" : "Device"
            })
        }
        if(_dimensionCondition["AppVersion"]){
            rowFilters.push({
                "values" : [ _dimensionCondition["AppVersion"] ],
                "filterType" : "Set",
                "cubeField" : "AppVersion"
            })
        }

        var query ={
            "dataSource" : _dataSource,
            "appKey" : "25a03f9f3557a2305744262f25245583",
            "metric" : _metric,
            "since" : _eventB+"Day",
            "rowFields" : [ _eventB+"Day" ],
            "rowFilters" :rowFilters,
            "columnField" : _interval+"Age",
            "columnFilters" : [ {
                "values" : [ _eventA ],
                "filterType" : "Set",
                "cubeField" : "AfterEvent"
            }, {
                "values" : [ _rangeFrom+"|"+_rangeTo ],
                "filterType" : "Range",
                "cubeField" : _interval+"Age"
            } ]
        }
        return query;
    }
}(window.countlyCohort = window.countlyCohort || {}, jQuery));