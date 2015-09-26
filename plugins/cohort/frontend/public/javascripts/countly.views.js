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
        this.templateData = {
            "page-title":jQuery.i18n.map["cohort.title"],
            "logo-class":"cohort"
        };
        if (!isRefresh) {
            $(this.el).html(this.template(this.templateData));
            countlyCohort.refreshData(function(){
                self.drawGraph();
            });
        }
    },
    refresh:function () {
        var self = this;
        if (app.activeView != self) {
            return false;
        }
        self.renderCommon(true);
        newPage = $("<div>" + self.template(self.templateData) + "</div>");

        $(self.el).find("#big-numbers-container").replaceWith(newPage.find("#big-numbers-container"));

        countlyCohort.refreshData(function(){
            self.drawGraph();
        });
        app.localize();
    },
    afterRender:function(){

        var self = this;

        $(".selectable").click(clickSelectable);

        $(".addCondition").click(function(){
            var $this= $(this);
            showOptions($(this),countlyCohort.getOptionList("dimensionCondition"),function(value){
                $option = $('<p>'+value+':<span class="btn" title="'+value+'" _name="'+value+'">'+value+'</span></p>');
                $option.find(".btn").click(clickOptional);
                $("#optional-condition").append($option);
                countlyCohort.addCondition(value);
            });
        });
        $(".removeCondition").click(function(){
            var $this= $(this);
            showOptions($(this),countlyCohort.getOptionList("dimensionCondition"),function(value){
                $this.text(value);
                countlyCohort.setValue(name,value);
            });
        });
        $("#submit").click(function(){

            self.refresh();
        })

        function clickSelectable(){
            var $this= $(this);
            var name = $this.attr("_name");

            showOptions($(this),countlyCohort.getOptionList(name),function(value){
                $this.text(value);
                countlyCohort.setValue(name,value);
            });
        }

        function clickOptional(){
            var $this= $(this);
            var name = $this.attr("_name");

            showOptions($(this),countlyCohort.getConditionOptionList(name),function(value){
                $this.text(value);
                countlyCohort.setConditionValue(name,value);
            });
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
            $modal.find(".option").click(function(){
                callback($(this).text());
                $modal.remove();
            })


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
