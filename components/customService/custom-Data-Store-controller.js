/**
 * Created by sudiksha
 */
//Controller for the header section
var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('CustomDataStore',
    function ($scope,
        $modalInstance,
        organism,
        tei,
        MetaDataService,
        DataStoreService) {



        Object.assign(String.prototype, { deSum() { return (this.split(" ").filter((val) => (val == "/" || val == "-") ? false : val)).reduce((total, val) => total + "_" + val); } });
        $scope.tei = tei;
        $scope.organismName = organism;
        $scope.UniquedeNameValue = {};
        $scope.dataElementName = {};
        $scope.deNameValue = [];
        $scope.optionValue = {}

        $scope.createClass = (key, uid) => key + "_" + uid;


        MetaDataService.showOptionSet().then(function (data) {
            $scope.dataElementName[data.displayName.deSum()] = { name: data.displayName, de: [] };
            for (var i = 0; i < data.options.length; i++)
                $scope.dataElementName[data.displayName.deSum()].de.push({ id: data.options[i].id, name: data.options[i].name })
        });
        MetaDataService.showdataElement().then(function (data) {
            let deElemtuids = { hVypvMfCrFy: true, ua4lNScEMe3: true, BTbb8ir12WL: true, vTi9yXbQ1Cw: true, JJuF3vE7xB9: true, tdtBR9OdXMJ: true }
            data.listGrid.rows.forEach((val) => (deElemtuids[val[4]]) ? $scope.dataElementName[val[1].deSum()] = { name: val[1], de: [] } : false)
            data.listGrid.rows.forEach((value) => (deElemtuids[value[4]]) ? $scope.dataElementName[value[1].deSum()].de.push({ name: value[2], id: value[3], key: value[1].deSum() }) : false)
            $scope.deNameValue = Object.keys($scope.dataElementName);
            $scope.deNameValue.forEach((v, i) => $scope.dataElementName[v].de.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)))
        });

        DataStoreService.getFromDataStore($scope.tei).then(function (responseDataStore) {
            if (responseDataStore.id === tei && responseDataStore.name === organism_name) {
                document.getElementById("submit").style.display = "none";
                document.getElementById("update").style.display = "initial";
            }
            else if (responseDataStore.status === 404) {
                document.getElementById("submit").style.display = "initial";
                document.getElementById("update").style.display = "none";
            }
            console.log(responseDataStore);
        });
        $scope.checkUpdateValue = function () {
            $scope.inputBox1 = ""; $scope.inputBox2 = ""; $scope.inputBox3 = ""; $scope.inputBox4 = "";
            DataStoreService.getFromDataStore($scope.tei).then(function (res) {
                if (res.status != 404) {
                    $scope.UniquedeNameValue = res;
                    let getdatakeys = Object.keys(res);
                    for (var i = 0; i < getdatakeys.length - 2; i++) {
                        for (var j = 0; j < res[getdatakeys[i]].length; j++) {
                            let dataele = res[getdatakeys[i]][j],
                                element = document.getElementsByClassName(getdatakeys[i] + "_" + dataele.id);
                            element[0].checked = true
                            if (getdatakeys[i] === "MIC" || getdatakeys[i] === "Disk_Diffusion") {
                                element[1].value = dataele.Susceptible;
                                element[2].value = dataele.Intermediate_High;
                                element[3].value = dataele.Intermediate_Low;
                                element[4].value = dataele.Resistant;
                                for (let i = 0; i < element.length; i++) {
                                    if (dataele.display) {
                                        element[i].disabled = false;
                                    }
                                    else {
                                        element[0].checked = true;
                                        element[0].checked = false;
                                    }
                                    if (element[i].value == "undefined") {
                                        element[i].value = "";
                                    }
                                }

                            }
                        }
                    }
                }
            })
        }

        $scope.deleteDataStore = function () {
            DataStoreService.deleteFromDataStore(tei).then(function (res) {
                if (res.httpStatus === 'OK' && res.httpStatusCode === 200) {
                    alert("Organism" + organismName + " -- " + res.message);
                    $modalInstance.close();
                }
            });
        };

        $scope.selectCheck = function (ele) {
            var obj = Object.keys($scope.UniquedeNameValue)
            if (obj.length == 0) {
                $scope.UniquedeNameValue[ele.deval.key] = [];
                obj = Object.keys($scope.UniquedeNameValue)
            }
            if (obj.indexOf(ele.deval.key) == -1)
                $scope.UniquedeNameValue[ele.deval.key] = [];

            for (var key in $scope.UniquedeNameValue) {
                if (ele.deval.key == key)
                    $scope.UniquedeNameValue[ele.deval.key].push({ id: ele.deval.id, name: ele.deval.name, display: true })
            }
            var tdvalue = document.getElementsByClassName(ele.deval.key + "_" + ele.deval.id);
            if (tdvalue[0].checked == false) {
                for (var i = $scope.UniquedeNameValue[ele.deval.key].length - 1; i > 0; i--) {
                    if ($scope.UniquedeNameValue[ele.deval.key][i].name === ele.deval.name)
                        $scope.UniquedeNameValue[ele.deval.key].splice(i, 1)
                }
            }
        }
        $scope.checkAll = function (ele) {
            var obj = Object.keys($scope.UniquedeNameValue)
            if (obj.length == 0) {
                $scope.UniquedeNameValue[ele.deval.key] = [];
                obj = Object.keys($scope.UniquedeNameValue)
            }
            if (obj.indexOf(ele.deval.key) == -1)
                $scope.UniquedeNameValue[ele.deval.key] = [];
            for (var key in $scope.UniquedeNameValue) {
                if (ele.deval.key == key)
                    $scope.UniquedeNameValue[ele.deval.key].push({ id: ele.deval.id, name: ele.deval.name, display: true })
            }
            var tdvalue = document.getElementsByClassName(ele.deval.key + "_" + ele.deval.id);
            if (tdvalue[0].checked == true) {
                if (ele.deval.key === "MIC" || ele.deval.key === "Disk_Diffusion") {
                    for (var i = 1; i < tdvalue.length; i++)
                        tdvalue[i].disabled = false;
                    //$scope.UniquedeNameValue[ele.deval.key].pop()
                    for (var i = 0; i < $scope.UniquedeNameValue[ele.deval.key].length; i++) {
                        if ($scope.UniquedeNameValue[ele.deval.key][i].name === ele.deval.name) {
                            $scope.UniquedeNameValue[ele.deval.key][i].display = true;
                        }
                    }
                } else {
                    for (var i = 1; i < tdvalue.length; i++)
                        tdvalue[i].disabled = false;
                }
            }
            else {
                if (ele.deval.key === "MIC" || ele.deval.key === "Disk_Diffusion") {
                    for (var i = 1; i < tdvalue.length; i++)
                        tdvalue[i].disabled = true;
                    $scope.UniquedeNameValue[ele.deval.key].pop()
                    for (var i = 0; i < $scope.UniquedeNameValue[ele.deval.key].length; i++) {
                        if ($scope.UniquedeNameValue[ele.deval.key][i].name === ele.deval.name) {
                            $scope.UniquedeNameValue[ele.deval.key][i].display = false;
                        }
                    }
                } else {
                    for (var i = 1; i < tdvalue.length; i++) {
                        if (tdvalue[i].disabled == false) {
                            tdvalue[i].disabled = true;
                            // for (var k = 1; k < tdvalue.length; k++){
                            //     tdvalue[k].value = ""; }
                        }
                        for (var i = $scope.UniquedeNameValue[ele.deval.key].length - 1; i > 0; i--) {
                            if ($scope.UniquedeNameValue[ele.deval.key][i].name === ele.deval.name) {
                                $scope.UniquedeNameValue[ele.deval.key].splice(i, 1)
                            }

                        }

                    }
                }

            }
        }
        $scope.inputChange1 = function (ele) {
            var inputbox = document.getElementsByClassName(ele.deval.key + '_' + ele.deval.id)
            var selinputbox = []
            for (var i = 1; i < inputbox.length; i++) {
                if (inputbox[i].id === "1")
                    selinputbox.push(inputbox[i])
            }
            $scope.UniquedeNameValue[ele.deval.key].map((val, index) => {
                if (val.id == ele.deval.id)
                    $scope.UniquedeNameValue[ele.deval.key][index].Susceptible = selinputbox[0].value;
            })
        }
        $scope.inputChange2 = function (ele) {
            var inputbox = document.getElementsByClassName(ele.deval.key + '_' + ele.deval.id);
            var selinputbox = []
            for (var i = 1; i < inputbox.length; i++) {
                if (inputbox[i].id === "2")
                    selinputbox.push(inputbox[i])
            }
            $scope.UniquedeNameValue[ele.deval.key].map((val, index) => {
                if (val.id == ele.deval.id)
                    $scope.UniquedeNameValue[ele.deval.key][index].Intermediate_High = selinputbox[0].value;
            })
        }
        $scope.inputChange3 = function (ele) {
            var inputbox = document.getElementsByClassName(ele.deval.key + '_' + ele.deval.id)
            var selinputbox = []
            for (var i = 1; i < inputbox.length; i++) {
                if (inputbox[i].id === "3")
                    selinputbox.push(inputbox[i])
            }
            $scope.UniquedeNameValue[ele.deval.key].map((val, index) => {
                if (val.id == ele.deval.id)
                    $scope.UniquedeNameValue[ele.deval.key][index].Intermediate_Low = selinputbox[0].value;
            })
        }
        $scope.inputChange4 = function (ele) {
            var inputbox = document.getElementsByClassName(ele.deval.key + '_' + ele.deval.id)
            var selinputbox = []
            for (var i = 1; i < inputbox.length; i++) {
                if (inputbox[i].id === "4")
                    selinputbox.push(inputbox[i])
            }
            $scope.UniquedeNameValue[ele.deval.key].map((val, index) => {
                if (val.id == ele.deval.id)
                    $scope.UniquedeNameValue[ele.deval.key][index].Resistant = selinputbox[0].value;
            })
        }

        $scope.postDeData = function () {
            $scope.UniquedeNameValue.id = $scope.tei;
            $scope.UniquedeNameValue.name = $scope.organismName;
            $scope.UniquedeNameValue.Sample_type = $scope.optionValue.undefined;
            console.log(`here`);
            DataStoreService.saveInDataStore($scope.UniquedeNameValue).then(function (response) {
                $modalInstance.close();
                console.log(response);
            });

        };

        $scope.postDeUpdatedData = function () {
            $scope.UniquedeNameValue.Sample_type = optionValue.undefined
            DataStoreService.updateInDataStore($scope.UniquedeNameValue).then(function (response) {
                var modal = document.getElementById('myModal');
                modal.style.display = "none";
                console.log(response);
            });
        }

        $scope.selectAllcheckbox = function (thiz, param) {
            let dekey = param.deSum();
            var obj = Object.keys($scope.UniquedeNameValue)
            if (obj.length == 0) {
                $scope.UniquedeNameValue[dekey] = [];
                obj = Object.keys($scope.UniquedeNameValue)
            }
            if (obj.indexOf(dekey) == -1)
                $scope.UniquedeNameValue[dekey] = [];

            let dataElement = thiz.dataElementName[param];
            for (let i = 0; i < dataElement.length; i++) {
                let checkBox = document.getElementsByClassName(dataElement[i].key + '_' + dataElement[i].id);
                if (!checkBox[0].checked) {
                    checkBox[0].checked = true;
                    $scope.UniquedeNameValue[dekey].push({ id: dataElement[i].id, name: dataElement[i].name })
                }
                if (param === "MIC" || param === "Disk Diffusion") {
                    for (let i = 1; i < checkBox.length; i++) {
                        if (checkBox[i].disabled) {
                            checkBox[i].disabled = false;
                        }
                    }
                }
            }
        }
        $scope.unselectAllcheckbox = function (thiz, param) {
            let dekey = param.deSum(),
                dataElement = thiz.dataElementName[param];
            if (param === "MIC" || param === "Disk Diffusion") {
                for (let i = 0; i < $scope.UniquedeNameValue[dekey].length; i++) {
                    $scope.UniquedeNameValue[dekey][i].display = false;
                }
            }
            else { $scope.UniquedeNameValue[dekey] = []; }
            for (let i = 0; i < dataElement.length; i++) {
                let checkBox = document.getElementsByClassName(dataElement[i].key + '_' + dataElement[i].id)
                if (checkBox[0].checked)
                    checkBox[0].checked = false;
                if (param === "MIC" || param === "Disk Diffusion") {
                    for (let i = 1; i < checkBox.length; i++) {
                        if (!checkBox[i].disabled) {
                            checkBox[i].disabled = true;
                        }
                    }
                }
            }
        }

        $scope.searchtd = (thiz) => {
            var t = thiz.getAttribute('id');
            console.log(`here is am ${thiz.getAttribute('id')}`)

        }
        $('.myTabs a').click(function (e) {
            e.preventDefault()
            $(this).tab('show')
        })
        $scope.addTab = function () {

            var num_tabs = $("div#tabs ul li").length + 1;
            $("div#tabs ul").append(
                "<li  role='presentation' class='myTabs'><a data-toggle='tab' aria-controls=" + num_tabs + " role='tab' href=#" + num_tabs + ">#" + num_tabs + "</a></li>"
            );
            $("div#content ").append(
                "<div role='tabpanel' class='tab-pane' id=" + num_tabs + ">#" + num_tabs + "</div>"
            );
           // $("div#tabs").tabs("refresh");
        };

        // $("#search1").on("keyup", function () {
        //     var value = $(this).val().toLowerCase();
        //     $("#Sample_type tr").filter(function () {
        //         $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        //     });
        // });

        // $("#search2").on("keyup", function () {
        //     var value = $(this).val().toLowerCase();
        //     $("#Disk_Diffusion tr").filter(function () {
        //         $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        //     });
        // });

        // $("#MIC").on("keyup", function () {
        //     var value = $(this).val().toLowerCase();
        //     $("#MIC tr").filter(function () {
        //         $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        //     });
        // });

        // $("#search4").on("keyup", function () {
        //     var value = $(this).val().toLowerCase();
        //     $("#Results tr").filter(function () {
        //         $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        //     });
        // });

        // $("#search5").on("keyup", function () {
        //     var value = $(this).val().toLowerCase();
        //     $("#Genotypic_tests tr").filter(function () {
        //         $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        //     });
        // });

        // $("#search6").on("keyup", function () {
        //     var value = $(this).val().toLowerCase();
        //     $("#Phenotypic_tests tr").filter(function () {
        //         $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        //     });
        // });


        $scope.closeWindow = function () {
            $modalInstance.close();
        };

    });