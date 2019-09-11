#!/usr/bin/env node

var Excel = require('exceljs');
var dateFormat = require('dateformat');
//var configjs = require("./config.js");


Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

Date.prototype.addHours = function (h) {
    this.setHours(this.getHours() + h);
    return this;
}

Date.prototype.addMinutes = function (m) {
    this.setMinutes(this.getMinutes() + m);
    return this;
}


var configWorkbook = new Excel.Workbook();

configWorkbook.xlsx.readFile("config.xlsx")
    .then(configBook => {

        var configs = {

            tagNames: configBook.worksheets[0].getColumn(1).values.slice(2),
            simulateLowLimit : configBook.worksheets[0].getColumn(2).values.slice(2),
            simulateHighLimit : configBook.worksheets[0].getColumn(3).values.slice(2),
            analogOrDiscrete : configBook.worksheets[0].getColumn(4).values.slice(2),
            decimalSeparator : configBook.worksheets[0].getColumn(5).values.slice(2),
            timeSpan : configBook.worksheets[0].getColumn(6).values.slice(2),
            period : configBook.worksheets[0].getColumn(7).values.slice(2)

        };


        var outputWorkbook = createOutputWorkbook(configs);

        outputWorkbook.xlsx.writeFile("data_template.xlsx");
        console.log("Fínished");
    });


function createOutputWorkbook(configs) {
    var workbook = new Excel.Workbook()
    workbook.addWorksheet();
    var worksheet = workbook.worksheets[0];
    worksheet.name = "1";

    worksheet.columns = [{
            key: 'tag',
            width: 32
        },
        {
            key: 'ts',
            width: 32
        },
        {
            key: 'value',
            width: 32
        },
        {
            key: 'status',
            width: 32
        }
    ];

    workbook = getData(workbook, configs);
    return workbook;

}

function getData(workbook, configs) {
    var worksheet = workbook.worksheets[0];
    var tagNames = [];
    var timeStamps = getTimeStamps(configs.timeSpan, configs.period); //TÄSTÄ JATKUU KEHITYS
    var values = getValues(configs, timeStamps.length);
    var status = [];


    while (status.length !== timeStamps.length) {
        status.push("Good");
    }

    for (var j = 0; j < configs.tagNames.length; j++) {

        for (var i = 0; i < timeStamps.length / configs.tagNames.length; i++) {
            tagNames.push(configs.tagNames[j]);
        }
    }

    var timeStampsFinal = timeStamps;
    var valuesFinal = values;
    var statusFinal = status;


    /* for (var k = 1; k < configs.tagNames.length; k++) {
        timeStampsFinal = timeStampsFinal.concat(timeStamps);
        valuesFinal = valuesFinal.concat(values);
        statusFinal = statusFinal.concat(status);
    } */

    worksheet.getColumn("tag").values = tagNames;
    worksheet.getColumn("ts").values = timeStampsFinal;
    worksheet.getColumn("value").values = valuesFinal;
    worksheet.getColumn("status").values = statusFinal;

    worksheet._rows.forEach(e => {
        e.commit();
    });
    return workbook;
}



function getTimeStamps(timeSpan, period) {

    var totalTimeStamps = [];

    for(var i = 0; i < timeSpan.length; i++){
        var currentPeriod = period[i];
        var currentTimeSpan = timeSpan[i];

        var timeStamps = [];
        var dateNow = new Date();
        var dateNow2 = new Date();

        if (currentTimeSpan == "Month") {

            var timeMonthAgo = new Date(dateNow2.setMonth(dateNow2.getMonth() - 1));
            while (dateFormat(dateNow, "dd-mm-yyyy HH:MM:ss") !== dateFormat(timeMonthAgo, "dd-mm-yyyy HH:MM:ss")) {
    
                if (currentPeriod == "Hour") {
                    dateNow.addHours(-1);
                } else if (currentPeriod == "Day") {
                    dateNow = dateNow.addDays(-1);
                } else if (currentPeriod == "Minute") {
                    dateNow.addMinutes(-1);
                }
                var stamp = dateFormat(dateNow, "dd-mm-yyyy HH:MM:ss");
                timeStamps.push(stamp);
            }
    
        } else if (currentTimeSpan == "Day") {
    
            var timeDayAgo = dateNow2.addDays(-1);
            while (dateFormat(dateNow, "dd-mm-yyyy HH:MM:ss") !== dateFormat(timeDayAgo, "dd-mm-yyyy HH:MM:ss")) {
    
                if (currentPeriod == "Hour") {
                    dateNow.addHours(-1);
                } else if (currentPeriod == "Minute") {
                    dateNow.addMinutes(-1);
                }
                var stamp = dateFormat(dateNow, "dd-mm-yyyy HH:MM:ss");
                timeStamps.push(stamp);
            }
    
        } else if (currentTimeSpan == "Hour") {
            var timeHourAgo = dateNow2.addHours(-1);
            while (dateFormat(dateNow, "dd-mm-yyyy HH:MM:ss") !== dateFormat(timeHourAgo, "dd-mm-yyyy HH:MM:ss")) {
    
                if (currentPeriod == "Hour") {
                    dateNow.addHours(-1);
                } else if (currentPeriod == "Minute") {
                    dateNow.addMinutes(-1);
                }
                var stamp = dateFormat(dateNow, "dd-mm-yyyy HH:MM:ss");
                timeStamps.push(stamp);
            }
    
        } else if (currentTimeSpan == "Week") {
            var timeWeekAgo = dateNow2.addDays(-7);
            while (dateFormat(dateNow, "dd-mm-yyyy HH:MM:ss") !== dateFormat(timeWeekAgo, "dd-mm-yyyy HH:MM:ss")) {
    
                if (currentPeriod == "Minute") {
                    dateNow.addMinutes(-1);
                } else if (currentPeriod == "Hour") {
                    dateNow.addHours(-1);
                }
                var stamp = dateFormat(dateNow, "dd-mm-yyyy HH:MM:ss");
                timeStamps.push(stamp);
            }
    
        }
    
        totalTimeStamps = totalTimeStamps.concat(timeStamps);
        
    }

    return totalTimeStamps;


}

function getValues(config, timeStampCount) {
    var tagCount = config.tagNames.length;
    var totalVals = [];

    for(var i = 0; i < tagCount; i++){

        var analogOrDiscrete = config.analogOrDiscrete[i];
        var decimalSeparator = config.decimalSeparator[i];
        var valCount =  timeStampCount / tagCount;
        var vals = [];
        var ll = config.simulateLowLimit[i];
        var hl = config.simulateHighLimit[i];


        for(var j = 0; j < valCount ;j++){
            vals.push(randomValue(ll, hl, analogOrDiscrete, decimalSeparator));
        }
        totalVals = totalVals.concat(vals);
    }

    return totalVals;
}

function randomValue(ll, hl, analogOrDiscrete, decimalSeparator) {
    var val = Math.floor(Math.random() * (hl - ll + 1)) + ll;
    if (analogOrDiscrete == "a") {
        val = val + Math.random();
        val = val.toFixed(2);
        if (decimalSeparator == ",") {
            val = val.toString().replace(".", ",");
        }
    } else if (analogOrDiscrete = "d") {
        val = val;
    }

    return val;
}

