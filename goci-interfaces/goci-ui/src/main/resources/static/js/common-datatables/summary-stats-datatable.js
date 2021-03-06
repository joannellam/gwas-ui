/** First refactoring action: common js - DRY. From Xin original code
 *  Datatable action to rendering summary stats panel.
 *  SAB 2018. MVP.
 * */

/**
 * display summary_stats table
 * @param {Object} data - summary_stats solr docs
 * @param {Boolean} cleanBeforeInsert
 */
function displayDatatableSummaryStats(data) {
    //by default, we clean the table before inserting data
    var summary_stats_ids = [];
    $('#summary-stats-table').bootstrapTable('removeAll');
    
    var data_json = []
    $.each(data.response.docs, (index, summary_stats) => {
        var tmp={};
    var summary_stats_id = summary_stats.accessionId;
        summary_stats_ids.push(summary_stats_id);
        tmp['accessionId'] = '<a href="'+gwasProperties.contextPath+'studies/'+summary_stats_id+'">'+summary_stats_id+'</a>';
        tmp['author'] = summary_stats.author_s;
        tmp['pubmedId'] = summary_stats.pubmedId;
        tmp['title'] = summary_stats.title;
        tmp['journal'] = summary_stats.publication;
    // Publication date
    var p_date = summary_stats.publicationDate;
    var publi = p_date.split('T')[0];
    tmp['publication_date'] = publi;
    tmp['reported_trait'] = summary_stats.traitName_s;
    
    var mappedTraits = summary_stats.mappedLabel;
    if (mappedTraits) {
        $.each(mappedTraits, function (index, trait) {
            var link = gwasProperties.contextPath + 'efotraits/' + summary_stats.mappedUri[index].split('/').slice(-1)[0];
            mappedTraits[index] = setExternalLinkText(link, trait);
        });
        tmp['mappedTraits'] = mappedTraits.join(', ');
    } else {
        tmp['mappedTraits'] = '-';
    }
    // Number Associations
    var nr_association = 0;
    if ('association_rsId' in summary_stats) {
        var arraysize= summary_stats.association_rsId;
        nr_association = arraysize.length;
    }
    
    tmp['nr_associations'] = nr_association.toString();
    var a = (summary_stats.authorAscii_s).replace(/\s/g,"");
    var dir = a.concat("_").concat(summary_stats.pubmedId).concat("_").concat(summary_stats.accessionId);

    var ftplink = "<a href='ftp://ftp.ebi.ac.uk/pub/databases/gwas/summary_statistics/"
        .concat(dir).concat("' target='_blank'>");
    
    var linkFullPValue = ftplink.concat("FTP Download");
    tmp['link']=linkFullPValue;
    data_json.push(tmp);
    
    });
 
    $('#summary-stats-table').bootstrapTable({
        exportDataType: 'all',
        columns: [
            {
                field: 'author',
                title: 'First Author',
                sortable: true
            },
            {
                field: 'pubmedId',
                title: 'PubMed ID',
                sortable: true
            },
            {
                field: 'accessionId',
                title: 'Study accession',
                sortable: true
            },
            {
                field: 'publication_date',
                title: 'Publication date',
                sortable: true
            }, {
                field: 'journal',
                title: 'Journal',
                sortable: true
            },{
                field: 'title',
                title: 'Title',
                sortable: true,
                width:"120", //This works when the table is not nested into other tag, for example, in a simple Div
            },
            {
                field: 'mappedTraits',
                title: 'Trait(s)',
                sortable: true
            },
            {
                field: 'reported_trait',
                title: 'Reported trait',
                sortable: true
            },
            {
                field: 'nr_associations',
                title: 'Association count',
                sortable: true
            },
            {
                field: 'link',
                title: 'Data access',
                sortable: true
            }
        ],
        data: data_json,
        
    });
    
    $('#summary-stats-table').bootstrapTable('load',data_json);
    if(data_json.length>5){
        $('#summary-stats-table').bootstrapTable('refreshOptions',{showRefresh: true,pagination:true,pageSize: pageRowLimit, pageList: [5,10,25,50,100,'All']})
    }
    // Add custom tooltip text for button
    $('.keep-open').attr('title','Add/Remove Columns');
    hideLoadingOverLay('#summary-stats-table-loading');
}


function checkSummaryStatsDatabase(data) {
    $.each(data.response.docs, (index, summary_stats) => {
        var a = (summary_stats.authorAscii_s).replace(/\s/g, "");
        var dir = a.concat("_").concat(summary_stats.pubmedId).concat("_").concat(summary_stats.accessionId);
        checkIfStudyLoaded(summary_stats.accessionId, index, dir);
    });
}

function checkIfStudyLoaded(study_accession, index, dir) {
    return promiseGet('/gwas/summary-statistics/api/studies/' + study_accession,
        {}, 'application/x-www-form-urlencoded').then(JSON.parse).then(function (data) {
        // Only studies loaded in the Summary stats db will have a 200 response
        updateColumn(index, dir);
        return data;
    }).catch(function (err) {
        // console.error('Error when searching Summary Stats data for: ' + study_accession + '. ' + err);
    })
}

function updateColumn(index, dir) {
    var ftplink = "<a href='ftp://ftp.ebi.ac.uk/pub/databases/gwas/summary_statistics/"
        .concat(dir).concat("' target='_blank'>");
    var linkFullPValue = ftplink.concat("FTP Download").concat("<span class='glyphicon glyphicon-signal clickable context-help'" +
        "data-toggle='tooltip'" +
        "data-original-title='Click for summary statistics'></span></a>");
    var apiLink = "&nbsp;&nbsp;or&nbsp;&nbsp;<a href='http://www.ebi.ac.uk/gwas/summary-statistics/docs' target='_blank'>API access</a>";

    $('#summary-stats-table').bootstrapTable('updateRow', {
        index: index,
        row: {
            link: linkFullPValue+apiLink
        }
    });
}

