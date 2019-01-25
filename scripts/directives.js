/* global directive, selection, dhis2, angular */

'use strict';

/* Directives */

var trackerCaptureDirectives = angular.module('trackerCaptureDirectives', [])

    .directive('stringToNumber', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                ngModel.$parsers.push(function (value) {
                    return '' + value;
                });
                ngModel.$formatters.push(function (value) {
                    return parseFloat(value, 10);
                });
            }
        };
    })
    .directive('heightChangeSource', function ($window) {
        return {
            link: function (scope, element, attrs) {
                element.css("width", "100%");
                var w = angular.element($window);
                scope.getWindowDimensions = function () {
                    return {
                        'h': w.height(),
                        'w': w.width()
                    };
                };
                scope.$watch(function () {
                    if (element.height() !== scope._height) {
                        scope._height = element.height();
                    }
                });
                scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
                    if (scope._height !== element.height()) {
                        scope._height = element.height();
                        console.log("heightChangeSourceb");
                    }

                }, true);

                w.bind('resize', function () {
                    scope.$apply();
                });
            }
        };
    })
    .directive('heightChangeTarget', function () {
        return {
            link: function (scope, element, attrs) {
                scope.$watch('_height', function (newValue, oldValue) {
                    if (newValue && newValue !== oldValue) {
                        element.css('padding-top', newValue);
                    }

                }, true);
            }
        };
    })

    .directive('eventstatusInTable', function () {
        return {
            restrict: 'E',
            templateUrl: 'components/dataentry/eventstatus-in-table.html',
            scope: {
                event: '=',
                chosenEventWrapped: '=', //two-way-binding not working if not wrapped in object!
                getEventStyle: '=',
                programStage: '=',
                optionSets: '=',
                completeActionCustom: '=', //optional
                reopenActionCustom: '=', //optional
                validateActionCustom: '=', //optional
                deleteActionCustom: '=', //optional
                skipActionCustom: '=', //optional
                unskipActionCustom: '=', //optional
                notesActionCustom: '=', //optional            
                applicableButtons: '=', //optional
                actions: '=',
                allEvents: '=',
                formData: '=',
                buttonsEnabled: '&',
                deleteActionExtended: '='
            },
            controller: [
                '$scope',
                '$element',
                '$attrs',
                '$q',
                'EventUtils',
                'DHIS2EventFactory',
                'NotificationService',
                '$translate',
                function ($scope, $element, $attrs, $q, EventUtils, DHIS2EventFactory, NotificationService, $translate) {

                    $scope.EVENTSTATUSCOMPLETELABEL = "COMPLETED";
                    $scope.EVENTSTATUSSKIPPEDLABEL = "SKIPPED";
                    $scope.EVENTSTATUSVISITEDLABEL = "VISITED";
                    $scope.EVENTSTATUSACTIVELABEL = "ACTIVE";
                    $scope.EVENTSTATUSSCHEDULELABEL = "SCHEDULE";
                    var COMPLETE = "Complete";
                    var INCOMPLETE = "Incomplete";
                    var VALIDATE = "Validate";
                    var DELETE = "Delete";
                    var SKIP = "Skip";
                    var UNSKIP = "Unskip";
                    var NOTE = "Note";

                    $scope.completeAction = function () {
                        if (angular.isDefined($scope.completeActionCustom)) {
                            $scope.completeActionCustom();
                        }
                        else {
                            $scope.completeActionDefault();
                        }
                    };

                    $scope.reopenAction = function () {
                        if (angular.isDefined($scope.reopenActionCustom)) {
                            $scope.reopenActionCustom();
                        }
                        else {
                            $scope.reopenActionDefault();
                        }
                    };

                    $scope.validateAction = function () {
                        if (angular.isDefined($scope.validateActionCustom)) {
                            $scope.validateActionCustom();
                        }
                    };

                    $scope.deleteAction = function () {

                        if (angular.isDefined($scope.deleteActionCustom)) {
                            $scope.deleteActionCustom();
                        }
                        else {
                            var promise = $scope.deleteActionDefault();
                            if (angular.isDefined($scope.deleteActionExtended)) {
                                promise.then(function () {
                                    $scope.deleteActionExtended();
                                });
                            }
                        }

                    };

                    $scope.skipAction = function () {
                        if (angular.isDefined($scope.skipActionCustom)) {
                            $scope.skipActionCustom();
                        }
                    };

                    $scope.unskipAction = function () {
                        if (angular.isDefined($scope.unskipActionCustom)) {
                            $scope.unskipActionCustom();
                        }
                    };

                    $scope.showNotes = function () {
                        if (angular.isDefined($scope.notesActionCustom)) {
                            $scope.notesActionCustom();
                        }
                        else {
                            $scope.notesModal();
                        }
                    };

                    $scope.showNoteExistsIcon = true;
                    if (angular.isDefined($scope.applicableButtons)) {
                        $scope.showNoteExistsIcon = false;
                        for (var i = 0; i < $scope.applicableButtons.length; i++) {
                            if ($scope.applicableButtons[i] === NOTE) {
                                $scope.showNoteExistsIcon = true;
                                break;
                            }
                        }
                    }

                    $scope.notesSummary = function () {
                        var summary = "";
                        angular.forEach($scope.event.notes, function (note) {
                            if (summary !== "") {
                                summary += "<br/>";
                            }

                            if (note.value.length > 30) {
                                //find index of space
                                var noteSubstring = note.value.substr(0, 30);
                                var lastSpace = noteSubstring.lastIndexOf(" ");
                                if (lastSpace !== -1) {
                                    noteSubstring = noteSubstring.substr(0, lastSpace + 1);
                                }

                                summary += "- " + noteSubstring + "...";
                            }
                            else {
                                summary += "- " + note.value;
                            }
                        });

                        var summaryHeader = $translate.instant('notes');
                        summaryHeader += ":<br/>";

                        var summaryFooter = "<br/>(" + $translate.instant('click_to_edit_view_complete_notes') + ")";
                        summary = "<p align='left'>" + summaryHeader + summary + summaryFooter + "</p>";
                        return summary;
                    };

                    $scope.eventTableOptions = {};
                    $scope.eventTableOptions[COMPLETE] = { text: "Complete", tooltip: 'Complete', icon: "<span class='glyphicon glyphicon-check'></span>", value: COMPLETE, onClick: $scope.completeAction, sort: 0 };
                    $scope.eventTableOptions[INCOMPLETE] = { text: "Reopen", tooltip: 'Reopen', icon: "<span class='glyphicon glyphicon-pencil'></span>", value: INCOMPLETE, onClick: $scope.reopenAction, sort: 1 };
                    $scope.eventTableOptions[VALIDATE] = { text: "Validate", tooltip: 'Validate', icon: "<span class='glyphicon glyphicon-cog'></span>", value: VALIDATE, onClick: $scope.validateAction, sort: 2 };
                    $scope.eventTableOptions[DELETE] = { text: "Delete", tooltip: 'Delete', icon: "<span class='glyphicon glyphicon-floppy-remove'></span>", value: DELETE, onClick: $scope.deleteAction, sort: 3 };
                    $scope.eventTableOptions[SKIP] = { text: "Skip", tooltip: 'Skip', icon: "<span class='glyphicon glyphicon-step-forward'></span>", value: SKIP, onClick: $scope.skipAction, sort: 4 };
                    $scope.eventTableOptions[UNSKIP] = { text: "Schedule back", tooltip: 'Schedule back', icon: "<span class='glyphicon glyphicon-step-backward'></span>", value: UNSKIP, onClick: $scope.unskipAction, sort: 5 };
                    $scope.eventTableOptions[NOTE] = { text: "Notes", tooltip: 'Show notes', icon: "<span class='glyphicon glyphicon-list-alt'></span>", value: NOTE, onClick: $scope.showNotes, sort: 6 };

                    $scope.event.validatedEventDate = $scope.event.eventDate;

                    updateEventTableOptions();

                    $scope.$watch("event.status", function (newValue, oldValue) {

                        if (newValue !== oldValue) {
                            updateEventTableOptions();
                        }
                    });

                    $scope.$watch("validatedDateSetForEvent", function (newValue, oldValue) {

                        if (angular.isDefined(newValue)) {
                            if (!angular.equals(newValue, {})) {
                                var updatedEvent = newValue.event;
                                if (updatedEvent === $scope.event) {
                                    $scope.event.validatedEventDate = newValue.date;
                                    updateEventTableOptions();
                                }
                            }
                        }
                    });

                    function updateEventTableOptions() {

                        var eventRow = $scope.event;

                        for (var key in $scope.eventTableOptions) {
                            $scope.eventTableOptions[key].show = true;
                            $scope.eventTableOptions[key].disabled = false;
                        }

                        $scope.eventTableOptions[UNSKIP].show = false;

                        switch (eventRow.status) {
                            case $scope.EVENTSTATUSCOMPLETELABEL:
                                $scope.eventTableOptions[COMPLETE].show = false;
                                $scope.eventTableOptions[SKIP].show = false;
                                $scope.eventTableOptions[VALIDATE].show = false;
                                $scope.defaultOption = $scope.eventTableOptions[INCOMPLETE];
                                $scope.defaultOption2 = $scope.eventTableOptions[DELETE];
                                break;
                            case $scope.EVENTSTATUSSKIPPEDLABEL:
                                $scope.eventTableOptions[COMPLETE].show = false;
                                $scope.eventTableOptions[INCOMPLETE].show = false;
                                $scope.eventTableOptions[VALIDATE].show = false;
                                $scope.eventTableOptions[SKIP].show = false;

                                $scope.eventTableOptions[UNSKIP].show = true;
                                $scope.defaultOption = $scope.eventTableOptions[UNSKIP];
                                $scope.defaultOption2 = $scope.eventTableOptions[DELETE];
                                break;
                            default:
                                if (eventRow.validatedEventDate) {
                                    $scope.eventTableOptions[INCOMPLETE].show = false;
                                    $scope.defaultOption = $scope.eventTableOptions[COMPLETE];
                                    $scope.defaultOption2 = $scope.eventTableOptions[DELETE];
                                }
                                else {
                                    $scope.eventTableOptions[INCOMPLETE].show = false;
                                    $scope.eventTableOptions[VALIDATE].show = false;
                                    $scope.eventTableOptions[COMPLETE].disabled = true;
                                    $scope.defaultOption = $scope.eventTableOptions[COMPLETE];
                                    $scope.defaultOption2 = $scope.eventTableOptions[DELETE];
                                }
                                break;
                        }

                        createOptionsArray();
                    }

                    function createOptionsArray() {
                        $scope.eventTableOptionsArr = [];

                        if (angular.isDefined($scope.applicableButtons)) {
                            var defaultFound = false;
                            for (var key in $scope.eventTableOptions) {
                                var show = false;

                                for (var i = 0; i < $scope.applicableButtons.length; i++) {
                                    if ($scope.applicableButtons[i] === key) {
                                        show = true;
                                        break;
                                    }
                                }

                                if (show) {
                                    if ($scope.eventTableOptions[key] === $scope.defaultOption) {
                                        defaultFound = true;
                                    }
                                    $scope.eventTableOptionsArr.push($scope.eventTableOptions[key]);
                                }
                            }

                            $scope.eventTableOptionsArr.sort(function (a, b) {
                                return a.sort - b.sort;
                            });

                            if (!defaultFound) {
                                $scope.defaultOption = $scope.defaultOption2;
                            }
                        }
                        else {
                            for (var key in $scope.eventTableOptions) {
                                $scope.eventTableOptionsArr[$scope.eventTableOptions[key].sort] = $scope.eventTableOptions[key];
                            }
                        }
                    }

                    //-----------                
                    $scope.notesModal = function () {

                        var def = $q.defer();

                        var bodyList = [];
                        if ($scope.event.notes) {
                            for (var i = 0; i < $scope.event.notes.length; i++) {
                                var currentNote = $scope.event.notes[i];
                                bodyList.push({ value1: currentNote.storedDate, value2: currentNote.value });
                            }
                        }

                        var dialogOptions = {
                            closeButtonText: 'Close',
                            textAreaButtonText: 'Add',
                            textAreaButtonShow: $scope.event.status === $scope.EVENTSTATUSSKIPPEDLABEL ? false : true,
                            headerText: 'Notes',
                            bodyTextAreas: [{ model: 'note', placeholder: 'Add another note here', required: true, show: $scope.event.status === $scope.EVENTSTATUSSKIPPEDLABEL ? false : true }],
                            bodyList: bodyList,
                            currentEvent: $scope.event
                        };

                        var dialogDefaults = {

                            templateUrl: 'views/list-with-textarea-modal.html',
                            controller: function ($scope, $modalInstance, DHIS2EventFactory, DateUtils) {
                                $scope.modalOptions = dialogOptions;
                                $scope.formSubmitted = false;
                                $scope.currentEvent = $scope.modalOptions.currentEvent;
                                $scope.textAreaValues = [];

                                $scope.textAreaButtonClick = function () {
                                    if ($scope.textAreaModalForm.$valid) {
                                        $scope.note = $scope.textAreaValues["note"];
                                        $scope.addNote();
                                        $scope.textAreaModalForm.$setUntouched();
                                        $scope.formSubmitted = false;
                                    }
                                    else {
                                        $scope.formSubmitted = true;
                                    }
                                };

                                $scope.modalOptions.close = function () {
                                    $modalInstance.close($scope.currentEvent);
                                };

                                $scope.addNote = function () {

                                    var newNote = { value: $scope.note };
                                    var date = DateUtils.formatToHrsMins(new Date());

                                    var e = {
                                        event: $scope.currentEvent.event,
                                        program: $scope.currentEvent.program,
                                        programStage: $scope.currentEvent.programStage,
                                        orgUnit: $scope.currentEvent.orgUnit,
                                        trackedEntityInstance: $scope.currentEvent.trackedEntityInstance,
                                        notes: [newNote]
                                    };

                                    DHIS2EventFactory.updateForNote(e).then(function (data) {
                                        if (angular.isUndefined($scope.modalOptions.bodyList) || $scope.modalOptions.bodyList.length === 0) {
                                            $scope.modalOptions.bodyList = [{ value1: date, value2: newNote.value }];
                                            $scope.modalOptions.currentEvent.notes = [{ storedDate: date, value: newNote.value }];
                                        }
                                        else {
                                            $scope.modalOptions.bodyList.splice(0, 0, { value1: date, value2: newNote.value });
                                            $scope.modalOptions.currentEvent.notes.splice(0, 0, { storedDate: date, value: newNote.value });
                                        }
                                        $scope.note = $scope.textAreaValues["note"] = "";
                                    });

                                };
                            }
                        };

                        NotificationService.showNotifcationWithOptions(dialogDefaults, dialogOptions).then(function (e) {
                            $scope.event.notes = e.notes;
                            def.resolve();
                        });

                        return def.promise;
                    };

                    if (angular.isDefined($scope.actions)) {
                        $scope.actions[$scope.event.event] = {};
                        $scope.actions[$scope.event.event].notes = $scope.notesModal;
                    }
                    //-----------

                    $scope.deleteActionDefault = function () {

                        return DHIS2EventFactory.delete($scope.event).then(function (data) {

                            var foundIndex = -1;
                            //find index
                            for (var i = 0; i < $scope.allEvents.length; i++) {
                                if ($scope.allEvents[i] === $scope.event) {
                                    foundIndex = i;
                                    break;
                                }
                            }

                            if (foundIndex !== -1) {
                                $scope.allEvents.splice(foundIndex, 1);
                            }
                            setChosenEventToNothing();
                        });
                    };

                    $scope.completeActionDefault = function () {

                        $scope.event.submitted = true;
                        if ($scope.formData.$valid) {
                            var dhis2EventToUpdate = makeDhis2EventToUpdate();
                            dhis2EventToUpdate.status = $scope.EVENTSTATUSCOMPLETELABEL;
                            DHIS2EventFactory.update(dhis2EventToUpdate).then(function (data) {
                                $scope.event.status = $scope.EVENTSTATUSCOMPLETELABEL;
                                setChosenEventToNothing();

                                //reset dataElementStatus for event
                                $scope.event.deStatus = {};
                            });
                        }
                    };

                    $scope.reopenActionDefault = function () {
                        var dhis2EventToUpdate = makeDhis2EventToUpdate();
                        dhis2EventToUpdate.status = $scope.EVENTSTATUSACTIVELABEL;
                        DHIS2EventFactory.update(dhis2EventToUpdate).then(function (data) {
                            $scope.event.status = $scope.EVENTSTATUSACTIVELABEL;
                        });
                    }

                    function makeDhis2EventToUpdate() {

                        var dhis2EventToUpdate = {};

                        if (angular.isDefined($scope.programStage) && angular.isDefined($scope.optionSets)) {

                            var dhis2Event = EventUtils.reconstruct($scope.event, $scope.programStage, $scope.optionSets);
                            dhis2EventToUpdate = angular.copy(dhis2Event);
                        }
                        else {
                            dhis2EventToUpdate = angular.copy($scope.event);
                        }

                        /*
                        dhis2EventToUpdate.dataValues = [];
                        
                        for(var key in $scope.event[assocValuesProp]){
                            dhis2EventToUpdate.dataValues.push($scope.event[assocValuesProp][key]);
                        } */

                        return dhis2EventToUpdate;
                    }

                    function setChosenEventToNothing() {
                        $scope.chosenEventWrapped.currentEvent = {};
                    }

                    $scope.$watch('chosenEventWrapped.currentEvent', function (newEvent, oldEvent) {
                        if (angular.isDefined(newEvent)) {

                            if (newEvent !== oldEvent) {
                                $scope.chosenEvent = newEvent;
                            }
                        }
                    });


                }
            ]
        };
    })
    .directive('dhis2CompiledInclude', [
        '$templateCache',
        function ($templateCache) {
            return {
                restrict: 'A',
                priority: 400, // Same as ng-include
                compile: function (element, attrs) {
                    var templateName = attrs.dhis2CompiledInclude;
                    if (!templateName) {
                        throw new Error('ngInline: expected template name');
                    }
                    var template = $templateCache.get(templateName);
                    if (angular.isUndefined(template)) {
                        throw new Error('ngInline: unknown template ' + templateName);
                    }
                    element.html(template);
                }
            };
        }
    ])
    .directive('modalBody', function () {
        return {
            restrict: 'E',
            templateUrl: 'views/modal-body.html',
            scope: {
                body: '='
            },
            controller: [
                '$scope',
                '$translate',
                function ($scope, $translate) {

                }
            ]
        }
    })
    .directive('trackerTeiList', function () {
        return {
            restrict: 'E',
            templateUrl: 'views/tei-list.html',
            scope: {
                data: "=teiData",
                pager: "=?teiPager",
                sortColumn: "=?teiSortColumn",
                gridColumns: "=?teiGridColumns",
                refetchData: "&teiRefetchData",
                onTeiClicked: "&onTeiClicked",
            },


            controller: function ($scope,$modal, Paginator, TEIGridService, CurrentSelection, MetaDataService, DataStoreService, $timeout) {
                var attributesById = CurrentSelection.getAttributesById();
                $scope.$watch("pager", function () {
                    if ($scope.pager) {
                        Paginator.setPage($scope.pager.page);
                        Paginator.setPageCount($scope.pager.pageCount);
                        Paginator.setPageSize($scope.pager.pageSize);
                        Paginator.setItemCount($scope.pager.total);
                    }
                });

                $scope.$watch("data", function () {
                    setGridColumns();
                });

                var setGridColumns = function () {
                    if ($scope.data && !$scope.gridColumns) {
                        var columnAttributes = [];
                        angular.forEach($scope.data.headers, function (header) {
                            if (attributesById[header.id]) {
                                var attr = angular.copy(attributesById[header.id]);
                                attr.displayInListNoProgram = true;
                                columnAttributes.push(attr);
                            }
                        });
                        var gridColumnConfig = { showAll: true };
                        $scope.gridColumns = TEIGridService.makeGridColumns(columnAttributes, gridColumnConfig);
                    }
                }

                setGridColumns();

                $scope.sortGrid = function (gridHeader) {
                    if ($scope.sortColumn && $scope.sortColumn.id === gridHeader.id) {
                        $scope.sortColumn.direction = $scope.sortColumn.direction === 'asc' ? 'desc' : 'asc';
                    } else if (!$scope.sortColumn) {
                        $scope.sortColumn = { id: gridHeader.id, direction: 'asc' };
                    } else {
                        $scope.sortColumn.id = gridHeader.id;
                        $scope.sortColumn.direction = 'asc';
                    }
                    $scope.refetchData({ pager: $scope.pager, sortColumn: $scope.sortColumn });
                };
                // $scope.Internal = function (tei) {
                //     $scope.onTeiClicked({ tei: tei });
                // }
                $scope.onTeiClickedInternal = function (tei) {
                    $scope.onTeiClicked({ tei: tei });

                }

                $scope.getPage = function (page) {
                    $scope.pager.page = page;

                    $scope.refetchData({ pager: $scope.pager, sortColumn: $scope.sortColumn });
                };

                $scope.resetPageSize = function () {
                    $scope.pager.page = 1;
                    $scope.refetchData({ pager: $scope.pager, sortColumn: $scope.sortColumn });
                };

                $scope.jumpToPage = function () {
                    if ($scope.pager && $scope.pager.page && $scope.pager.pageCount && $scope.pager.page > $scope.pager.pageCount) {
                        $scope.pager.page = $scope.pager.pageCount;
                    }
                    $scope.refetchData({ pager: $scope.pager, sortColumn: $scope.sortColumn });

                };

                /**
                 * 
                 * Assign Data-Element form 
                 * 
                 * */
                $scope.onRedirect=function(){
                    return $modal.open({
                        templateUrl: 'components/customService/custom-Data-Store.html',
                        resolve: {
                            gridColumns: function () {
                                return angular.copy($scope.gridColumns);
                            }
                        },
                        controller: function($scope, gridColumns, $modalInstance){
                            $scope.gridColumns = gridColumns;
                            $scope.showCount = 0;
                            angular.forEach(gridColumns, function(column){
                                if(column.show) $scope.showCount++;
                            });
                            $scope.valueChanged = function(column){
                                if(column.show) $scope.showCount++;
                                else $scope.showCount--;
                            }
                            $scope.close = function(){
                                $modalInstance.close($scope.gridColumns);
                            }
                        }
                    }).result.then(function(gridColumns)
                    {
                        $scope.gridColumns = gridColumns;
                        var userGridColumns = {};
                        angular.forEach(gridColumns, function(gc){
                            userGridColumns[gc.id] = gc;
                        });
                        return UserDataStoreService.set(userGridColumns, gridColumnsContainer, $scope.base.selectedProgram.id);
                    }, function(){});
                }
                





                Object.assign(String.prototype, { deSum() { return (this.split(" ").filter((val) => (val == "/" || val == "-") ? false : val)).reduce((total, val) => total + "_" + val); } });
                //create td class
                $scope.createClass = (key, id) => key + "_" + id;
                // Get the modal
                var modal = document.getElementById('myModal');
                // Get the <span> element that closes the modal
                var span = document.getElementsByClassName("close")[0];
                // When the user clicks on <span> (x), close the modal
                span.onclick = function () {
                    modal.style.display = "none";
                }

                // close popUp Window
                $scope.closeWindow = function () {
                    modal.style.display = "none";
                };
                $scope.UniquedeNameValue = {};

                $scope.checkUpdateValue = function (tei, organism_name) {
                    $scope.inputBox1 = ""; $scope.inputBox2 = ""; $scope.inputBox3 = ""; $scope.inputBox4 = "";
                    DataStoreService.getFromDataStore(tei).then(function (res) {
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


                $scope.showPopUp = function (tei, organism_name, thiz) {
                    $scope.UniquedeNameValue = {};
                    $scope.dataElementName = {};
                    $scope.deNameValue = [];
                    $scope.organismName = organism_name;
                    MetaDataService.showdataElement().then(function (data) {
                        let deElemtuids = { hVypvMfCrFy: true, ua4lNScEMe3: true, BTbb8ir12WL: true, vTi9yXbQ1Cw: true, JJuF3vE7xB9: true, tdtBR9OdXMJ: true }
                        data.listGrid.rows.forEach((val) => (deElemtuids[val[4]]) ? $scope.dataElementName[val[1]] = [] : false)
                        data.listGrid.rows.forEach((value) => (deElemtuids[value[4]]) ? $scope.dataElementName[value[1]].push({ name: value[2], id: value[3], key: value[1].deSum() }) : false)
                        MetaDataService.showOptionSet().then(function (data) {
                            $scope.dataElementName[data.displayName] = [];
                            for (var i = 0; i < data.options.length; i++)
                                $scope.dataElementName[data.displayName].push({ id: data.options[i].id, name: data.options[i].name, key: data.displayName.deSum() })
                        });
                        $scope.deNameValue = Object.keys($scope.dataElementName);
                        $scope.deNameValue.forEach((v, i) => $scope.dataElementName[v].sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)))
                    });
                    document.getElementById("displayresponse").innerHTML = "";
                    $timeout(function () {

                        DataStoreService.getFromDataStore($scope.tei).then(function (responseDataStore) {
                            if (responseDataStore.id === tei && responseDataStore.name === organism_name) {
                                document.getElementById("displayresponse").innerHTML = "Existing";
                                document.getElementById("submit").style.display = "none";
                                document.getElementById("update").style.display = "initial";
                            }
                            else if (responseDataStore.status === 404) {
                                document.getElementById("displayresponse").innerHTML = "Not-Existing";
                                document.getElementById("submit").style.display = "initial";
                                document.getElementById("update").style.display = "none";
                            }
                            console.log(responseDataStore);
                        });

                    }, 0);
                    modal.style.display = "block";
                    setTimeout(() => {
                        $scope.checkUpdateValue(tei, organism_name)
                    }, 1000);
                }

                // delete close popUp Window
                $scope.deleteDataStore = function (tei, organismName) {
                    $timeout(function () {
                        DataStoreService.deleteFromDataStore(tei).then(function (responseDataStoreDelete) {
                            if (responseDataStoreDelete.httpStatus === 'OK' && responseDataStoreDelete.httpStatusCode === 200) {
                                alert("Organism" + organismName + " -- " + responseDataStoreDelete.message);
                                var modal = document.getElementById('myModal');
                                // Get the button that opens the modal
                                modal.style.display = "none";
                            }
                            console.log(responseDataStoreDelete);
                        });

                    }, 0);
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
                            $scope.UniquedeNameValue[ele.deval.key].pop()
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
                    $scope.UniquedeNameValue.name = $scope.organism;

                    DataStoreService.saveInDataStore($scope.UniquedeNameValue).then(function (response) {
                        var modal = document.getElementById('myModal');
                        // Get the button that opens the modal
                        modal.style.display = "none";
                        console.log(response);
                    });

                };

                $scope.postDeUpdatedData = function () {
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
                $('.myTabs a').click(function (e) {
                    e.preventDefault()
                    $(this).tab('show')
                })


                $("#search1").on("keyup", function () {
                    var value = $(this).val().toLowerCase();
                    $("#Sample_type tr").filter(function () {
                        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
                    });
                });

                $("#search2").on("keyup", function () {
                    var value = $(this).val().toLowerCase();
                    $("#Disk_Diffusion tr").filter(function () {
                        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
                    });
                });

                $("#search3").on("keyup", function () {
                    var value = $(this).val().toLowerCase();
                    $("#MIC tr").filter(function () {
                        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
                    });
                });

                $("#search4").on("keyup", function () {
                    var value = $(this).val().toLowerCase();
                    $("#Results tr").filter(function () {
                        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
                    });
                });

                $("#search5").on("keyup", function () {
                    var value = $(this).val().toLowerCase();
                    $("#Genotypic_tests tr").filter(function () {
                        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
                    });
                });

                $("#search6").on("keyup", function () {
                    var value = $(this).val().toLowerCase();
                    $("#Phenotypic_tests tr").filter(function () {
                        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
                    });
                });








            }
        }
    })