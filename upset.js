$(EventManager).bind("item-selection-added", function (event, data) {
    // console.log("Selection was added to selection list with color " + selections.getColor(data.selection) + ' and ' + data.selection.items.length + ' items.');

    data.selection.mapToSubsets(subSets);

    plotSelectionTabs("#selection-tabs", selections, data.selection);
    plotSelectedItems("#item-table", data.selection);
});

$(EventManager).bind("item-selection-updated", function (event, data) {
    //console.log('Selection was updated! New length is ' + data.selection.items.length + ' items.');

    data.selection.mapToSubsets(subSets);
    plot();
    plotSelectionTabs("#selection-tabs", selections, data.selection);
    plotSelectedItems("#item-table", data.selection);
    plotSetOverview();
});

$(EventManager).bind("item-selection-removed", function (event, data) {
//    console.log("Selection was removed from selection list.");

    data.selection.unmapFromSubsets(subSets);

    plot();
    plotSelectionTabs("#selection-tabs", selections, selections.getActive());
    plotSelectedItems("#item-table", selections.getActive());
    plotSetOverview();
});

$(EventManager).bind("item-selection-activated", function (event, data) {
    if (data.selection) {
        //       console.log('Selection ' + data.selection.id + ' was activated.');

        plot();
        plotSelectionTabs("#selection-tabs", selections, data.selection);
        plotSelectedItems("#item-table", data.selection);
        plotSetOverview();
    }
    else {
        plot();
        plotSelectionTabs("#selection-tabs", selections, data.selection);
        plotSelectedItems("#item-table", data.selection);
        plotSetOverview();
    }
});

$(EventManager).bind("ui-resize", function (event, data) {
    plot(Math.floor(data.newWidth * .66), Math.floor(data.newHeight));
    plotSetOverview();
});

$(EventManager).bind("ui-vertical-resize", function (event, data) {
    plot(undefined, Math.floor(data.newHeight));
    plotSetOverview();
});

$(EventManager).bind("ui-horizontal-resize", function (event, data) {
    plot(Math.floor(data.newWidth * .66), undefined);
    plotSetOverview();
});

$(EventManager).bind("loading-dataset-started", function (event, data) {
    $(".ui-fader").show();
    $("#data-loading-indicator").show();
});

$(EventManager).bind("loading-dataset-finished", function (event, data) {
    $(".ui-fader").fadeOut(1000);
    $("#data-loading-indicator").fadeOut(1000);
});

function plot(width, height) {

    var majorPadding = 5;
    var minorPadding = 2;
    var cellDistance = 20;
    var cellSize = cellDistance;// - minorPadding;
    var textHeight = 90;
    var textSpacing = 3;

    var xStartSetSizes = cellDistance * usedSets.length + majorPadding;
    var setSizeWidth = 700;
    var subSetSizeWidth = 300;

    var leftOffset = 90, topOffset = 120;

    /** The width from the start of the set vis to the right edge */


    var xStartExpectedValues = xStartSetSizes + subSetSizeWidth + 20;
    var expectedValueWidth = 300;

    var setVisWidth = expectedValueWidth + subSetSizeWidth + majorPadding + cellDistance + xStartSetSizes;

    var labelTopPadding = 15;

    var paddingTop = 30;
    var paddingSide = 20;

    var truncateAfter = 25;

    var setCellDistance = 12;
    var setCellSize = 10;

    var w = cellDistance * usedSets.length + majorPadding + leftOffset + subSetSizeWidth + expectedValueWidth + 50;
    //  var setMatrixHeight = setCellDistance + majorPadding;
    var subSetMatrixHeight;
    var h;
    var svgHeight = 10000; //height || 600;

    var rowScale;

    var grays = [ '#f0f0f0', '#636363'];

    function initRows() {

        subSetMatrixHeight = renderRows.length * cellDistance;
        h = subSetMatrixHeight + textHeight;

        rowScale = d3.scale.ordinal().rangeRoundBands([ textHeight, h ], 0);

        rowScale.domain(renderRows.map(function (d) {
            return d.id;
        }));
    }

    initRows();

    d3.select('#vis').select('svg').remove();
    var svg = d3.select('#vis')
        .style('width', w + "px")
        .append('svg')
        .attr('width', w)
        .attr('height', svgHeight);

    var vis = svg.append("g").attr({
        class: "visContainer",
        "transform": "translate(" + leftOffset + "," + topOffset + ")"
    });

    // define a clipping path for scrolling (@hen)
    /*
     svg.append("clipPath").attr({
     id: "visClipping"
     }).append("rect").attr('width', w)
     .attr('height', svgHeight + 150)
     .attr("transform", "translate(" + -leftOffset + "," + 0 + ")")
     vis.attr("clip-path", "url(#visClipping)")
     */

    // Rows container for vertical panning
    var gRows = vis.append('g')
        .attr(
        {'class': 'gRows', "transform": "translate(0,0)"}
    )
        .data([
            {'x': 0, 'y': 0, 'dx': 0, 'dy': 0}
        ]);

    /*
     var gScroll = vis.append('g')
     .attr('class', 'gScroll')
     .data([
     {'x': 0, 'y': 0}
     ]);
     */

    var gQuery = svg.append('g')
        .attr('class', 'gQuery')
        .attr("transform", "translate(" + -5 + "," + 2 + ")")
        .data([
            {'x': 0, 'y': 0}
        ]);

    /*
     // Extra layer for vertical panning
     vis.append('rect').attr({
     x: 0,
     y: 0,
     width: w,
     height: (textHeight - 5),
     fill: 'white'
     });
     */

    //####################### LogicPanel ##################################################

    var logicPanelNode = vis.append("g").attr({
        class: "logicPanel",
        "transform": "translate(" + -leftOffset + "," + (textHeight + 5) + ")"
    })

    var logicPanel = new LogicPanel(
        {width: setVisWidth + leftOffset,
            visElement: vis,
            panelElement: logicPanelNode,
            cellSize: cellSize,
            usedSets: usedSets,
            grays: grays,
            belowVis: gRows,
            buttonX: -leftOffset,
            buttonY: textHeight - 20,
            stateObject: UpSetState,
            callAfterSubmit: [updateState, rowTransition]

        }

    );

    //####################### SETS ##################################################

    var setRowScale = d3.scale.ordinal().rangeRoundBands([0, usedSets.length * (cellSize + 2)], 0);

    var subSetSizeHeight = textHeight - majorPadding;

    setRowScale.domain(usedSets.map(function (d) {
        return d.id;
    }));

    var setGrp = vis.selectAll('.setRow')
        .data(usedSets)
        .enter()
        .append('g')
        .attr({transform: function (d, i) {
            return 'translate(' + setRowScale(d.id) + ', 0)';
            //  return 'translate(0, ' + ( cellDistance * (i)) + ')';
        },
            class: 'setRow'});

    // ------------ the set labels -------------------

    var setLabels = vis.selectAll('.setLabel')
        .data(usedSets)
        .enter();

    setLabels.append('rect').attr({

        transform: function (d, i) {
            return 'skewX(45) translate(' + (cellDistance * i - leftOffset) + ', 0)';
        },
        width: cellSize,
        height: textHeight - 2,
        class: 'connection vertical'
    })
        .on('mouseover', mouseoverColumn)
        .on('mouseout', mouseoutColumn)

    setLabels.append('text').text(
        function (d) {
            return d.elementName.substring(0, truncateAfter);
        }).attr({
            class: 'setLabel',
            id: function (d) {
                return d.elementName.substring(0, truncateAfter);
            },
            transform: function (d, i) {
                return 'translate(' + (cellDistance * i + 5) + ',' + (textHeight - textSpacing - 2) + ')rotate(45)';
            },
            'text-anchor': 'end'
        })
        .on('mouseover', mouseoverColumn)
        .on('mouseout', mouseoutColumn)

    // ------------------- set size bars header --------------------

    vis.append('rect')
        .attr({
            class: 'labelBackground subsetSizeLabel',
            id: 'sortIntersectionSizeGlobal',
            transform: 'translate(' + xStartSetSizes + ',' + (labelTopPadding) + ')',
            height: '20',
            width: subSetSizeWidth

        });

    vis.append('text').text('Subset Size')
        .attr({
            class: 'columnLabel subsetSizeLabel',
            transform: 'translate(' + (xStartSetSizes + subSetSizeWidth / 2) + ',' + (labelTopPadding + 10) + ')'
        });

    // scale for the size of the plottingSets
    var subSetSizeScale = d3.scale.linear().domain([0, d3.max(dataRows, function (d) {
        return d.setSize;
    })]).nice().range([0, subSetSizeWidth]);

    var subSetSizeAxis = d3.svg.axis().scale(subSetSizeScale).orient('top').ticks(4);

    vis.append('g').attr()
        .attr({class: 'axis',
            transform: 'translate(' + xStartSetSizes + ',' + (textHeight - 5) + ')'
        })
        .call(subSetSizeAxis);

    // ------------ expected value header -----------------------

    vis.append('rect')
        .attr({
            class: 'labelBackground expectedValueLabel',
            id: 'sortRelevanceMeasureGlobal',
            transform: 'translate(' + xStartExpectedValues + ',' + ( labelTopPadding) + ')',
            height: '20',
            width: expectedValueWidth

        });

    vis.append('text').text('Deviation from Expected Value')
        .attr({
            class: 'columnLabel',
            //  id: 'sortRelevanceMeasureGlobal',
            transform: 'translate(' + (xStartExpectedValues + expectedValueWidth / 2) + ',' + ( labelTopPadding + 10) + ')'
        });

    // scale for the size of the plottingSets
    var minDeviation = d3.min(dataRows, function (d) {
        return d.expectedValueDeviation;
    });
    if (minDeviation > 0) {
        minDeviation = 0;
    }
    var maxDeviation = d3.max(dataRows, function (d) {
        return d.expectedValueDeviation;
    });

    var expectedValueScale = d3.scale.linear().domain([minDeviation, maxDeviation]).nice().range([0, expectedValueWidth]);

    var expectedValueAxis = d3.svg.axis().scale(expectedValueScale).orient('top').ticks(4);

    vis.append('g').attr()
        .attr({class: 'axis',
            transform: 'translate(' + xStartExpectedValues + ',' + (textHeight - 5) + ')'
        })
        .call(expectedValueAxis);

    /*
     // Invisible background to capture the pan interaction with the subsets
     gRows.append('rect').attr({
     x: 0,
     y: textHeight,
     width: w - 120,
     height: h,
     fill: 'white',
     class: 'background-subsets'
     });
     */
    plotSubSets();
    setUpSortSelections();

    // ################## SUBSETS #########################

    function plotSubSets() {

        // ------------------- the rows -----------------------
        var subSets = gRows.selectAll('.row')
            .data(renderRows, function (d, i) {
                return d.id;
            });

        var grp = subSets
            .enter()
            .append('g')
            .attr({transform: function (d) {
                if (d.data.type === ROW_TYPE.SUBSET)
                    return 'translate(0, ' + rowScale(d.id) + ')';
                else
                    return 'translate(0, ' + textHeight + ')';
            }, class: function (d) {
                return 'row ' + d.data.type;
            }
            }).style("opacity", function (d) {
                if (d.data.type === ROW_TYPE.SUBSET)
                    return gRows.selectAll('.row')[0].length == 0 ? 1 : 0;
                else
                    return gRows.selectAll('.row')[0].length ? 0 : 1;
            })

        subSets.exit().remove();

        subSets
            .transition().duration(function (d, i) {
                if (d.data.type === ROW_TYPE.SUBSET)
                    return queryParameters['duration'];
                else
                    return queryParameters['duration'];
            }).attr({transform: function (d) {
                return 'translate(0, ' + rowScale(d.id) + ')';
            }, class: function (d) {
                return 'row ' + d.data.type;
            }}).transition().duration(100).style("opacity", 1);

        // ------------ the combination matrix ----------------------

        // scale for the set containment
        var setScale = d3.scale.ordinal().domain([0, 1]).range(grays);

        var combinationRows = subSets.filter(function (d) {
            return d.data.type === ROW_TYPE.SUBSET;
        })
        /*
         // add transparent background to make each row it sensitive for interaction
         combinationRows.selectAll('.backgroundRect').data(function (d) {
         return [d]
         })
         .enter().append("rect").attr({
         class: "backgroundRect",
         x: 0,
         y: 0,
         width: setVisWidth,
         height: cellSize
         })
         .style({
         "fill-opacity": 0,
         fill: "grey" // for debugging
         })
         .on({
         'mouseover': mouseoverRow,
         'mouseout': mouseoutRow
         });
         */
        combinationRows.selectAll('g').data(function (d) {
                // binding in an array of size one
                return [d.data.combinedSets];
            }
        ).enter()
            .append('g')
            .attr({class: 'combination'
            })

//            .each(function (d) {
//                console.log(d);
//            });

        vis.selectAll('.combination').selectAll('.cell').data(function (d) {
            return d;
        }).enter()
            .append('circle')
            .on('click', function (d) {
                // click event for cells
            })
            .attr('cx', function (d, i) {
                return (cellDistance) * i + cellSize / 2;
            })
            .attr({
                r: cellSize / 2 - 1,
                cy: cellSize / 2,
                class: 'cell'
            })
            .style('fill', function (d) {
                return setScale(d);

            })
            .on('mouseover', mouseoverCell)
            .on('mouseout', mouseoutCell)

        // add the connecting line for cells
        vis.selectAll('.combination').selectAll('.cellConnector').data(
            function (d) {
                // get maximum and minimum index of cells with value 1
                var extent = d3.extent(
                    d.map(function (dd, i) {
                        if (dd == 1) return i; else return -1;
                    })
                        .filter(function (dd, i) {
                            return dd >= 0;
                        })
                )

                // dont do anything if there is only one (or none) cell
                if (extent[0] == extent[1]) return [];
                else return [extent];
            }
        ).enter().append("line").attr({
                class: "cellConnector",
                x1: function (d) {
                    return (cellDistance) * d[0] + cellSize / 2;
                },
                x2: function (d) {
                    return (cellDistance) * d[1] + cellSize / 2;
                },
                y1: cellSize / 2,
                y2: cellSize / 2
            }).style({
                "stroke": setScale(1),
                "stroke-width": 3
            })

        // Handling groups

        var groups = vis.selectAll('.row').select(function (d, i) {
            if (d.data.type === ROW_TYPE.GROUP || d.data.type === ROW_TYPE.AGGREGATE)
                return this;
            return null;
        })

        groups.append('rect').attr({
            class: 'groupBackGround',
            width: setVisWidth + leftOffset,
            height: cellSize,
            x: -leftOffset,
            y: 0
        }).on('click', function (d) {
                collapseGroup(d.data);
                rowTransition();
            });

        //  console.log('g2: ' + groups);

        groups.append('text').text(function (d) {
            if (d.data.type === ROW_TYPE.GROUP)
                return d.data.elementName;
            else if (d.data.type === ROW_TYPE.AGGREGATE)
                return String.fromCharCode(8709) + '-subsets (' + d.data.subSets.length + ') ';
        })
            .attr({class: 'groupLabel',
                y: cellSize - 3,
                x: -leftOffset,
                'font-size': cellSize - 6

            });

        // ------------------------ set size bars -------------------

        vis.selectAll('.row').filter(function (d) {
            if (d.data.type === ROW_TYPE.SUBSET)
                return d;
        })
            .append('rect')
            .on('click', function (d) {
                intersectionClicked(d);

            })
            .attr("class", function (d) {
                return ( 'subSetSize row-type-subset' );
            })
            .attr({
                //class: 'subSetSize',
                transform: function (d) {
                    var y = 0;
                    if (d.data.type !== ROW_TYPE.SUBSET)
                        y = 0;//cellSize / 3 * .4;
                    return   'translate(' + xStartSetSizes + ', ' + y + ')'; // ' + (textHeight - 5) + ')'
                },

                width: function (d) {
                    return subSetSizeScale(d.data.setSize);
                },
                height: function (d) {
                    if (d.data.type === ROW_TYPE.SUBSET)
                        return cellSize;
                    else
                        return cellSize;// / 3;
                }
            })
            .on('mouseover', mouseoverRow)
            .on('mouseout', mouseoutRow);

        vis.selectAll('.row')
            .append('text').text(function (d) {
                return d.data.setSize;
            }).attr({class: 'intersectionSizeText intersectionSizeLabel',
                y: cellSize - 6,
                x: function (d) {
                    return xStartSetSizes + subSetSizeScale(d.data.setSize) + 2;
                }

            }).on('click', function (d) {
                intersectionClicked(d)
            });

        var intersectionClicked = function (d) {
            var selection = Selection.fromSubset(d.data);
            selections.addSelection(selection);
            selections.setActive(selection);
        }

        groupRows = vis.selectAll('.row').filter(function (d) {
            if (d.data.type === ROW_TYPE.GROUP)
                return [];
        }).append("g")

        groupRows.each(function (e, j) {

            var g = d3.select(this);
            var max_scale = subSetSizeScale.domain()[1] - 10;

            var i = 0;
            var nbLevels = Math.ceil(e.data.setSize / max_scale);
            var data = d3.range(Math.ceil(e.data.setSize / max_scale)).map(function () {
                var f = JSON.parse(JSON.stringify(e))
                console.log(e, f, i, e.data.setSize)
                if (i == nbLevels - 1)
                    f.data.setSize = (f.data.setSize % max_scale);
                else
                    f.data.setSize = max_scale;
                console.log("aaa", i, nbLevels, f.data.setSize)
                i++;
                return f;
            })

            g.selectAll(".row-type-group").data(data).enter().append('rect')
                .on('click', function (d) {
                    var selection = Selection.fromSubset(d.data.subSets);
                    selections.addSelection(selection);
                    selections.setActive(selection);
                })
                .attr("class", function (d) {
                    return ( 'subSetSize row-type-group' );

                })
                .attr({
                    //class: 'subSetSize',
                    transform: function (d) {
                        var y = 0;
                        if (d.data.type !== ROW_TYPE.SUBSET)
                            y = 0;//cellSize / 3 * .4;
                        return   'translate(' + xStartSetSizes + ', ' + y + ')'; // ' + (textHeight - 5) + ')'
                    },

                    width: function (d) {
                        return subSetSizeScale(d.data.setSize);
                    },
                    height: function (d, i) {
                        return cellSize;
                    }
                })
                .style("opacity", function (d, i) {
                    return .5 + .5 * i / nbLevels;
                })
                .on('mouseover', mouseoverRow)
                .on('mouseout', mouseoutRow);
        })

        renderOverlay();
        // Rendering the highlights for selections on top of the selected subsets
        function renderOverlay() {
            if (selections.getSize() == 0) {
                return;
            }

            vis.selectAll('.row')
                .append('rect')
                .on('click', function (d) {
                    if (d.data.type === ROW_TYPE.SUBSET) {
                        var selection = Selection.fromSubset(d.data);
                        selections.addSelection(selection);
                        selections.setActive(selection);
                    }
                })
                .attr({
                    class: 'what',

                    transform: function (d) {
                        var y = 0;
                        if (d.data.type !== ROW_TYPE.SUBSET)
                            y = 0; //cellSize / 3 * .4;
                        return   'translate(' + xStartSetSizes + ', ' + y + ')'; // ' + (textHeight - 5) + ')'
                    },

                    width: function (d) {
                        var s = d.data.selections;
                        if (typeof s !== 'object') {
                            return 0;
                        }

                        var usedID = false;
                        //   var alternativeID;
                        var sIDs = Object.getOwnPropertyNames(s);
                        sIDs.forEach(function (prop) {
                            var length = s[prop].length;
                            if (selections.isActiveByUuid(prop)) {
                                usedID = prop;
                            }
                        });
                        if (!usedID) {
                            return 0;
                        }
                        d3.select(this).style("fill", selections.getColorFromUuid(usedID));
                        return   subSetSizeScale(s[usedID].length);
                    },
                    height: function (d) {
                        if (d.data.type === ROW_TYPE.SUBSET)
                            return cellSize;
                        else
                            return cellSize// / 3;

                    }
                })
                .on('mouseover', mouseoverRow)
                .on('mouseout', mouseoutRow)

            // the triangles for the multiple selections

            var selIndicatorRows = svg.selectAll('.row');
            selIndicatorRows.selectAll('.selectionIndicators').data(function (d, i) {
                if (!d.data.selections)
                    return [];
                var selectionIDs = Object.getOwnPropertyNames(d.data.selections);
                var selArray = selectionIDs.map(function (k) {
                    return {uuid: k, items: d.data.selections[k]};
                });
                selArray = selArray.filter(function (d) {
                    return d.items.length !== 0;
                })
                return selArray;
            })
                .enter()
                .append('path').attr({
                    class: 'selectionIndicators',
                    transform: function (d, i) {

                        return 'translate(' + (xStartSetSizes + subSetSizeScale(d.items.length)) + ' , ' + 0 +
                            ')';
                    },
                    d: function (d) {
                        return  " M -5 0  L  5 0  L 0 6 z M 0 6 L 0 " + cellSize;
                    },

                    stroke: 'white',
                    "stroke-width": 1,
                    fill: function (d, i) {
                        return selections.getColorFromUuid(d.uuid);
                    }
                }).on('click', function (d) {
                    selections.setActiveByUuid(d.uuid);
                    renderOverlay();
                })

        }

        // ----------------------- expected value bars -------------------

        vis.selectAll('.row')
            .append('rect')
            .attr({
                class: function (d) {
                    return d.data.expectedValueDeviation < 0 ? 'expectedValueDeviation negative' : 'expectedValueDeviation positive';
                },
                transform: function (d) {
                    var start = expectedValueScale(d3.min([0, d.data.expectedValueDeviation]));
                    start += xStartExpectedValues;
                    var y = 0;
                    if (d.data.type !== ROW_TYPE.SUBSET)
                        y = 0;//cellSize / 3 * 1.7;
                    return 'translate(' + start + ', ' + y + ')';
                },
                width: function (d) {
                    //  console.log(d.data.expectedValueDeviation)
                    return Math.abs(expectedValueScale(d.data.expectedValueDeviation) - expectedValueScale(0));
                },
                height: function (d) {
                    if (d.data.type === ROW_TYPE.SUBSET)
                        return cellSize;
                    else
                        return cellSize;// / 3;
                }
            })
            .on('mouseover', mouseoverRow)
            .on('mouseout', mouseoutRow)

        // -------------------- panning -------------------

        function panning(d) {

            //    console.log("pann", d, d.y)
            d3.event.scale = 1
            var dy = d3.event.translate[0] - prev_y;
            prev_y = d3.event.translate[0];

            //    console.log("pann", d, d.y, dy, d3.event.translate, d3.event.translate*d3.event.scale)

            d.y += dy;
            d.y = Math.max(0, d.y);

            // d.y = Math.min(Math.min(0, d.y), params.viewportHeight - params.rowsHeight);

            var offset = params.viewportHeight - params.rowsHeight;
            var offsetRemain = Math.min(params.viewportHeight - params.rowsHeight, 0);
            //d.y = Math.min(0, d.y+offsetRemain);
            //    console.log("ssss", d, d.y, d.y+offsetRemain, offsetRemain , d3.event.scale)

            // console.log("trans", trans, Math.min(0, d3.event.translate[0]), Math.max(0, params.rowsHeight - params.viewportHeight))

            // d3.event.translate[0] = Math.min(0, d3.event.translate[0]);
            //if(params.rowsHeight>params.viewportHeight) {

            // Moving rows containing the subsets
            d3.select(this).attr('transform', 'translate(0, ' + -d.y + ')');

            // Rows background should stick to his place
            d3.select(".background-subsets").attr('transform', function (d, i) {
                return 'translate(' + [ 0, d.y] + ')'
            })

            // Update the scrollbar
            //scrollbar.setValue(d3.event.translate[0]);

            //  console.log(params.rowsHeight, params.viewportHeight, subSets.length, setGroups.length, d3.transform(d3.select(this).attr("transform")).translate[1], trans)

        }

        /*
         var pan = d3.behavior.zoom()
         //  .scaleExtent([0, 10])
         .on('zoom', panning);

         var prev_y = 0;
         d3.select('.gRows').call(pan);
         */

        // -------------------- scrollbar -------------------

        /*
         params = {
         x: w - 20 - leftOffset,
         y: 85,
         height: svgHeight - 205,
         viewportHeight: svgHeight - 210,
         rowsHeight: subSetMatrixHeight,
         parentEl: d3.select('.gScroll')
         }

         var scrollbar = new Scrollbar(params);
         */

    }

// -------------------- row transitions ----------------------------

    function rowTransition() {

        initRows();
        plotSubSets();

    }

    function setUpSortSelections() {

        /** Passing true will disable the group */
        function toggleGroupingL2(disable) {
            var noGroupingL2 = $('#noGroupingL2');

            if (disable) {
                noGroupingL2.prop('checked', true);
            }
            noGroupingL2.prop('disabled', disable);

            $('#groupByIntersectionSizeL2').prop('disabled', disable);
            $('#groupBySetL2').prop('disabled', disable);
            $('#groupByRelevanceMeasureL2').prop('disabled', disable);
        }

        function disableL2Equivalent(id) {
            var l2 = $(id);
            if (l2.prop('checked')) {
                $('#noGroupingL2').prop('checked', true);
            }
            l2.prop('disabled', true);
        }

        // ----------- grouping L1 -------------------------

        d3.selectAll('#groupByIntersectionSize').on(
            'click',
            function (d) {
                UpSetState.grouping = StateOpt.groupByIntersectionSize;
                UpSetState.levelTwoGrouping = undefined;
                toggleGroupingL2(false);
                disableL2Equivalent('#groupByIntersectionSizeL2');

                updateState();
                rowTransition();
//                d3.selectAll('#groupByIntersectionSizeL2').attr('disabled', true);
            });

        d3.selectAll('#groupBySet').on(
            'click',
            function (d) {
                UpSetState.grouping = StateOpt.groupBySet;
                UpSetState.levelTwoGrouping = undefined;
                toggleGroupingL2(false);
                disableL2Equivalent('#groupBySetL2');

                updateState();
                rowTransition();
            });

        d3.selectAll('#groupByRelevanceMeasure').on(
            'click',
            function (d) {
                UpSetState.grouping = StateOpt.groupByRelevanceMeasure;
                UpSetState.levelTwoGrouping = undefined;
                toggleGroupingL2(false);
                disableL2Equivalent('#groupByRelevanceMeasureL2');
                updateState();
                rowTransition();
            });

        d3.selectAll('#noGrouping').on(
            'click',
            function (d) {
                UpSetState.grouping = undefined;
                UpSetState.levelTwoGrouping = undefined;
                UpSetState.forceUpdate = true;

                toggleGroupingL2(true);

                updateState();
                rowTransition();
            });

        // ---------------- Grouping L2 -----------

        d3.selectAll('#groupByIntersectionSizeL2').on(
            'click',
            function (d) {
                UpSetState.levelTwoGrouping = StateOpt.groupByIntersectionSize;
                updateState();
                rowTransition();
            });

        d3.selectAll('#groupBySetL2').on(
            'click',
            function (d) {
                UpSetState.levelTwoGrouping = StateOpt.groupBySet;
                updateState();
                rowTransition();
            });

        d3.selectAll('#groupByRelevanceMeasureL2').on(
            'click',
            function (d) {
                UpSetState.levelTwoGrouping = StateOpt.groupByRelevanceMeasure;
                updateState();
                rowTransition();
            });

        d3.selectAll('#noGroupingL2').on(
            'click',
            function (d) {
                UpSetState.levelTwoGrouping = undefined;
                updateState();
                rowTransition();
            });

        // ------- options ----

        d3.selectAll('#collapseAll').on(
            'click',
            function (d) {
                UpSetState.collapseAll = true;
                UpSetState.collapseChanged = true;
                updateState();
                rowTransition();
            });

        d3.selectAll('#expandAll').on(
            'click',
            function (d) {
                UpSetState.expandAll = true;
                UpSetState.collapseChanged = true;
                updateState();
                rowTransition();
            });

        // --------- sortings ------

        // sort based on occurrence of one specific data item
        d3.selectAll('.setLabel').on(
            'click',
            function (d) {

                UpSetState.sorting = StateOpt.sortBySetItem;
                UpSetState.grouping = undefined;
                UpSetState.levelTwoGrouping = undefined;
                updateState(d);
                rowTransition();
            });

        d3.selectAll('#sortNrSetsInIntersection').on(
            'click',
            function (d) {
                UpSetState.sorting = StateOpt.sortByCombinationSize;
//                UpSetState.grouping = undefined;
//                UpSetState.levelTwoGrouping = undefined;
                UpSetState.forceUpdate = true;
                updateState();
                rowTransition();
            });

        d3.selectAll('#sortIntersectionSizeGlobal').on(
            'click',
            function (d) {
                UpSetState.sorting = StateOpt.sortBySubSetSize;
                UpSetState.grouping = undefined;
                UpSetState.levelTwoGrouping = undefined;
                UpSetState.forceUpdate = true;
                $('#noGrouping').prop('checked', true);
                toggleGroupingL2(true);
                $('#sortIntersectionSize').prop('checked', true);

                updateState();
                rowTransition();
            });

        d3.selectAll('#sortIntersectionSize').on(
            'click',
            function (d) {
                UpSetState.sorting = StateOpt.sortBySubSetSize;
                UpSetState.forceUpdate = true;
                updateState();
                rowTransition();
            });

        // Not preserving the grouping
        d3.selectAll('#sortRelevanceMeasureGlobal').on(
            'click',
            function () {
                UpSetState.sorting = StateOpt.sortByExpectedValue;
                UpSetState.grouping = undefined;
                UpSetState.levelTwoGrouping = undefined;
                UpSetState.forceUpdate = true;
                $('#noGrouping').prop('checked', true);
                $('#sortRelevanceMeasure').prop('checked', true);
                toggleGroupingL2(true);
                updateState();
                rowTransition();
            });

        // Preserving the grouping
        d3.selectAll('#sortRelevanceMeasure').on(
            'click',
            function () {
                UpSetState.sorting = StateOpt.sortByExpectedValue;
                UpSetState.forceUpdate = true;
                updateState();
                rowTransition();
            });

    }

    vis.append('text').text('SVG ' + w + "/" + svgHeight)
        .attr({
            transform: 'translate(0, ' + (labelTopPadding + 10) + ')'
        });

}
