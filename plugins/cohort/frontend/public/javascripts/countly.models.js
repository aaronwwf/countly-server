(function (countlyCohort, $, undefined) {
    //Private Properties
    var _data ={};

    var _metric="";
    var _eventA="";
    var _eventB="";
    var _interval="";
    var _dimension="";
    var _dimensionCondition={};
    var _metaData={};

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
                    return ["Anything", "In-App Purchase", "GameSession", "Won", "Lost"];
                }
            case "eventB":
                return  ["Installation", "Launch", "In-App Purchase", "GameSession", "Won", "Lost"];
            case "interval":
                return  ["Day","Week","Month"];
            case "dimension":
                return  ["AppVersion","Country","Device"];
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
            case "inteval":
                _interval=value;
                break;
            case "dimension":
                _dimension=value;
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
            case "inteval":
                return _interval;
            case "dimension":
                return _dimension;
            default:
                return;
        }
    }

    countlyCohort.getConditionOptionList = function(name) {

        if(name === "AppVersion"){
            return ["v1","v2","v3"];

        }else if(name === "Country"){
            return ["China","Singapore","America","Other"];

        }else if(name === "Device"){
            return  ["Android","Ios","Blackberry","Windows"];
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
                    _elapsedInMS = data.result.elapsedInMS;
                    callback();
                }else{
                    alert("can't get data");
                }
            }
        });


    }
}(window.countlyCohort = window.countlyCohort || {}, jQuery));