import logger from '../../logger';
import { replaceAll } from '../../utils/string';
import kibanaServer from './kibana';
import { CreateConnectionDashboardParams } from './types';

async function createConnectionDashboard(params: CreateConnectionDashboardParams) {
  // This serialized json contains information about the dashboard and lenses
  // eslint-disable-next-line no-useless-escape
  const panelsJSON = '[{\"type\":\"lens\",\"gridData\":{\"x\":0,\"y\":0,\"w\":25,\"h\":8,\"i\":\"5feeb5d2-706e-45e4-9d13-f3bb9bcbb2c2\"},\"panelIndex\":\"5feeb5d2-706e-45e4-9d13-f3bb9bcbb2c2\",\"embeddableConfig\":{\"enhancements\":{},\"attributes\":{\"visualizationType\":\"lnsXY\",\"state\":{\"visualization\":{\"legend\":{\"isVisible\":true,\"position\":\"right\"},\"valueLabels\":\"hide\",\"fittingFunction\":\"None\",\"axisTitlesVisibilitySettings\":{\"x\":true,\"yLeft\":true,\"yRight\":true},\"tickLabelsVisibilitySettings\":{\"x\":true,\"yLeft\":true,\"yRight\":true},\"labelsOrientation\":{\"x\":0,\"yLeft\":0,\"yRight\":0},\"gridlinesVisibilitySettings\":{\"x\":true,\"yLeft\":true,\"yRight\":true},\"preferredSeriesType\":\"bar_stacked\",\"layers\":[{\"layerId\":\"6879515e-0679-4d58-a106-0be35406f8a3\",\"seriesType\":\"line\",\"xAccessor\":\"45949a51-327e-4e1c-832a-95a4d87900f0\",\"accessors\":[\"f8a7b266-939c-4caf-af1f-b0c769e99081\",\"3a45265d-83f1-45ea-97ab-c81489cf38a6\"],\"layerType\":\"data\"}]},\"query\":{\"query\":\"\",\"language\":\"kuery\"},\"filters\":[],\"datasourceStates\":{\"formBased\":{\"layers\":{\"6879515e-0679-4d58-a106-0be35406f8a3\":{\"columns\":{\"45949a51-327e-4e1c-832a-95a4d87900f0\":{\"label\":\"@timestamp\",\"dataType\":\"date\",\"operationType\":\"date_histogram\",\"sourceField\":\"@timestamp\",\"isBucketed\":true,\"scale\":\"interval\",\"params\":{\"interval\":\"auto\",\"includeEmptyRows\":true,\"dropPartials\":false}},\"f8a7b266-939c-4caf-af1f-b0c769e99081\":{\"label\":\"CPU\",\"dataType\":\"number\",\"operationType\":\"last_value\",\"isBucketed\":false,\"scale\":\"ratio\",\"sourceField\":\"system_health.system.cpu\",\"filter\":{\"query\":\"\\\"system_health.system.cpu\\\": *\",\"language\":\"kuery\"},\"params\":{\"sortField\":\"@timestamp\"},\"customLabel\":true},\"3a45265d-83f1-45ea-97ab-c81489cf38a6\":{\"label\":\"RAM\",\"dataType\":\"number\",\"operationType\":\"last_value\",\"isBucketed\":false,\"scale\":\"ratio\",\"sourceField\":\"system_health.context.mem\",\"filter\":{\"query\":\"\\\"system_health.context.mem\\\": *\",\"language\":\"kuery\"},\"params\":{\"sortField\":\"@timestamp\"},\"customLabel\":true}},\"columnOrder\":[\"45949a51-327e-4e1c-832a-95a4d87900f0\",\"f8a7b266-939c-4caf-af1f-b0c769e99081\",\"3a45265d-83f1-45ea-97ab-c81489cf38a6\"],\"incompleteColumns\":{},\"sampling\":1}}},\"indexpattern\":{\"layers\":{}},\"textBased\":{\"layers\":{}}},\"internalReferences\":[],\"adHocDataViews\":{}},\"references\":[{\"type\":\"index-pattern\",\"id\":\"f1473957-6980-45da-85e0-4305bc9096b4\",\"name\":\"indexpattern-datasource-layer-6879515e-0679-4d58-a106-0be35406f8a3\"}]}},\"title\":\"CPU & Memory\"},{\"type\":\"lens\",\"gridData\":{\"x\":25,\"y\":0,\"w\":23,\"h\":8,\"i\":\"886ec657-aff9-4f8d-85f2-d52ae74e5133\"},\"panelIndex\":\"886ec657-aff9-4f8d-85f2-d52ae74e5133\",\"embeddableConfig\":{\"hidePanelTitles\":false,\"enhancements\":{},\"attributes\":{\"visualizationType\":\"lnsXY\",\"state\":{\"visualization\":{\"legend\":{\"isVisible\":true,\"position\":\"right\"},\"valueLabels\":\"hide\",\"fittingFunction\":\"None\",\"axisTitlesVisibilitySettings\":{\"x\":true,\"yLeft\":true,\"yRight\":true},\"tickLabelsVisibilitySettings\":{\"x\":true,\"yLeft\":true,\"yRight\":true},\"labelsOrientation\":{\"x\":0,\"yLeft\":0,\"yRight\":0},\"gridlinesVisibilitySettings\":{\"x\":true,\"yLeft\":true,\"yRight\":true},\"preferredSeriesType\":\"line\",\"layers\":[{\"layerId\":\"2406dfc5-4ec4-4829-8df1-c8a29123f68f\",\"seriesType\":\"line\",\"accessors\":[\"c27c04e5-0c13-4484-8118-17b6bd2aeba4\",\"6a3af99e-3f06-4e0c-a014-78f2d05e7433\"],\"layerType\":\"data\",\"xAccessor\":\"ce326ac7-0d3e-4f5b-babb-17fd45b04aab\"}]},\"query\":{\"query\":\"\",\"language\":\"kuery\"},\"filters\":[],\"datasourceStates\":{\"formBased\":{\"layers\":{\"2406dfc5-4ec4-4829-8df1-c8a29123f68f\":{\"columns\":{\"c27c04e5-0c13-4484-8118-17b6bd2aeba4\":{\"label\":\"Battery\",\"dataType\":\"number\",\"operationType\":\"last_value\",\"isBucketed\":false,\"scale\":\"ratio\",\"sourceField\":\"system_health.battery.level\",\"filter\":{\"query\":\"\\\"system_health.battery.level\\\": *\",\"language\":\"kuery\"},\"params\":{\"sortField\":\"@timestamp\",\"format\":{\"id\":\"custom\",\"params\":{\"decimals\":0}}},\"customLabel\":true},\"ce326ac7-0d3e-4f5b-babb-17fd45b04aab\":{\"label\":\"@timestamp\",\"dataType\":\"date\",\"operationType\":\"date_histogram\",\"sourceField\":\"@timestamp\",\"isBucketed\":true,\"scale\":\"interval\",\"params\":{\"interval\":\"auto\",\"includeEmptyRows\":true,\"dropPartials\":false}},\"6a3af99e-3f06-4e0c-a014-78f2d05e7433\":{\"label\":\"Charging\",\"dataType\":\"number\",\"operationType\":\"unique_count\",\"scale\":\"ratio\",\"sourceField\":\"system_health.battery.charging\",\"isBucketed\":false,\"filter\":{\"query\":\"system_health.battery.charging :true \",\"language\":\"kuery\"},\"params\":{\"emptyAsNull\":true},\"customLabel\":true}},\"columnOrder\":[\"ce326ac7-0d3e-4f5b-babb-17fd45b04aab\",\"c27c04e5-0c13-4484-8118-17b6bd2aeba4\",\"6a3af99e-3f06-4e0c-a014-78f2d05e7433\"],\"incompleteColumns\":{},\"sampling\":1}}},\"indexpattern\":{\"layers\":{}},\"textBased\":{\"layers\":{}}},\"internalReferences\":[],\"adHocDataViews\":{}},\"references\":[{\"type\":\"index-pattern\",\"id\":\"f1473957-6980-45da-85e0-4305bc9096b4\",\"name\":\"indexpattern-datasource-layer-2406dfc5-4ec4-4829-8df1-c8a29123f68f\"}]}},\"title\":\"Power\"},{\"type\":\"lens\",\"gridData\":{\"x\":0,\"y\":8,\"w\":24,\"h\":15,\"i\":\"1e57a1e4-13f3-43a9-a692-81a198a36642\"},\"panelIndex\":\"1e57a1e4-13f3-43a9-a692-81a198a36642\",\"embeddableConfig\":{\"hidePanelTitles\":false,\"enhancements\":{},\"attributes\":{\"visualizationType\":\"lnsXY\",\"state\":{\"visualization\":{\"legend\":{\"isVisible\":true,\"position\":\"right\"},\"valueLabels\":\"hide\",\"fittingFunction\":\"None\",\"axisTitlesVisibilitySettings\":{\"x\":true,\"yLeft\":true,\"yRight\":true},\"tickLabelsVisibilitySettings\":{\"x\":true,\"yLeft\":true,\"yRight\":true},\"labelsOrientation\":{\"x\":0,\"yLeft\":0,\"yRight\":0},\"gridlinesVisibilitySettings\":{\"x\":true,\"yLeft\":true,\"yRight\":true},\"preferredSeriesType\":\"bar\",\"layers\":[{\"layerId\":\"74b5e9b0-1244-4f22-b4de-acf684fd3120\",\"seriesType\":\"bar\",\"xAccessor\":\"1f0a246a-f007-4140-acd1-cbde776540df\",\"splitAccessor\":\"9dca87c4-aa27-4901-b6b0-edd762c9b3ef\",\"accessors\":[\"e79ed8c2-0801-428e-b76d-ff9db2f41aa1\"],\"layerType\":\"data\"}]},\"query\":{\"query\":\"\",\"language\":\"kuery\"},\"filters\":[],\"datasourceStates\":{\"formBased\":{\"layers\":{\"74b5e9b0-1244-4f22-b4de-acf684fd3120\":{\"columns\":{\"e79ed8c2-0801-428e-b76d-ff9db2f41aa1\":{\"label\":\"Count of userId.keyword\",\"dataType\":\"number\",\"operationType\":\"count\",\"isBucketed\":false,\"scale\":\"ratio\",\"sourceField\":\"userId.keyword\",\"params\":{\"format\":{\"id\":\"custom\",\"params\":{\"decimals\":0}},\"emptyAsNull\":true}},\"1f0a246a-f007-4140-acd1-cbde776540df\":{\"label\":\"@timestamp\",\"dataType\":\"date\",\"operationType\":\"date_histogram\",\"sourceField\":\"@timestamp\",\"isBucketed\":true,\"scale\":\"interval\",\"params\":{\"interval\":\"auto\",\"includeEmptyRows\":true,\"dropPartials\":false}},\"9dca87c4-aa27-4901-b6b0-edd762c9b3ef\":{\"label\":\"Top 3 values of userId.keyword\",\"dataType\":\"string\",\"operationType\":\"terms\",\"scale\":\"ordinal\",\"sourceField\":\"userId.keyword\",\"isBucketed\":true,\"params\":{\"size\":3,\"orderBy\":{\"type\":\"column\",\"columnId\":\"e79ed8c2-0801-428e-b76d-ff9db2f41aa1\"},\"orderDirection\":\"desc\",\"otherBucket\":true,\"missingBucket\":false,\"parentFormat\":{\"id\":\"terms\"},\"include\":[],\"exclude\":[],\"includeIsRegex\":false,\"excludeIsRegex\":false}}},\"columnOrder\":[\"9dca87c4-aa27-4901-b6b0-edd762c9b3ef\",\"1f0a246a-f007-4140-acd1-cbde776540df\",\"e79ed8c2-0801-428e-b76d-ff9db2f41aa1\"],\"sampling\":1,\"ignoreGlobalFilters\":false,\"incompleteColumns\":{}}}},\"indexpattern\":{\"layers\":{}},\"textBased\":{\"layers\":{}}},\"internalReferences\":[],\"adHocDataViews\":{}},\"references\":[{\"type\":\"index-pattern\",\"id\":\"f1473957-6980-45da-85e0-4305bc9096b4\",\"name\":\"indexpattern-datasource-layer-74b5e9b0-1244-4f22-b4de-acf684fd3120\"}]}},\"title\":\"Connected Users\"},{\"type\":\"lens\",\"gridData\":{\"x\":24,\"y\":8,\"w\":24,\"h\":15,\"i\":\"1f6fe6a8-7754-4b1a-8fde-ac7124655427\"},\"panelIndex\":\"1f6fe6a8-7754-4b1a-8fde-ac7124655427\",\"embeddableConfig\":{\"hidePanelTitles\":false,\"enhancements\":{},\"attributes\":{\"visualizationType\":\"lnsXY\",\"state\":{\"visualization\":{\"legend\":{\"isVisible\":true,\"position\":\"right\"},\"valueLabels\":\"hide\",\"fittingFunction\":\"None\",\"axisTitlesVisibilitySettings\":{\"x\":true,\"yLeft\":true,\"yRight\":true},\"tickLabelsVisibilitySettings\":{\"x\":true,\"yLeft\":true,\"yRight\":true},\"labelsOrientation\":{\"x\":0,\"yLeft\":0,\"yRight\":0},\"gridlinesVisibilitySettings\":{\"x\":true,\"yLeft\":true,\"yRight\":true},\"preferredSeriesType\":\"bar_stacked\",\"layers\":[{\"layerId\":\"e6e06fa2-b3df-4f14-a2d7-d71f163a758c\",\"seriesType\":\"bar_stacked\",\"xAccessor\":\"4145a8de-975e-4b2f-91e4-c1f5dc52df39\",\"splitAccessor\":\"eaf31c2a-55af-447a-bd4e-7712a2b7b29d\",\"accessors\":[\"a8fbfc9d-8698-4ab1-8ef0-c42060bc0d9e\"],\"layerType\":\"data\"}]},\"query\":{\"query\":\"\",\"language\":\"kuery\"},\"filters\":[],\"datasourceStates\":{\"formBased\":{\"layers\":{\"e6e06fa2-b3df-4f14-a2d7-d71f163a758c\":{\"columns\":{\"eaf31c2a-55af-447a-bd4e-7712a2b7b29d\":{\"label\":\"Top 5 values of command.keyword\",\"dataType\":\"string\",\"operationType\":\"terms\",\"scale\":\"ordinal\",\"sourceField\":\"command.keyword\",\"isBucketed\":true,\"params\":{\"size\":5,\"orderBy\":{\"type\":\"column\",\"columnId\":\"a8fbfc9d-8698-4ab1-8ef0-c42060bc0d9e\"},\"orderDirection\":\"desc\",\"otherBucket\":true,\"missingBucket\":false,\"parentFormat\":{\"id\":\"terms\"},\"include\":[],\"exclude\":[],\"includeIsRegex\":false,\"excludeIsRegex\":false}},\"4145a8de-975e-4b2f-91e4-c1f5dc52df39\":{\"label\":\"@timestamp\",\"dataType\":\"date\",\"operationType\":\"date_histogram\",\"sourceField\":\"@timestamp\",\"isBucketed\":true,\"scale\":\"interval\",\"params\":{\"interval\":\"auto\",\"includeEmptyRows\":true,\"dropPartials\":false}},\"a8fbfc9d-8698-4ab1-8ef0-c42060bc0d9e\":{\"label\":\"Unique count of command.keyword\",\"dataType\":\"number\",\"operationType\":\"unique_count\",\"scale\":\"ratio\",\"sourceField\":\"command.keyword\",\"isBucketed\":false,\"params\":{\"emptyAsNull\":true}}},\"columnOrder\":[\"eaf31c2a-55af-447a-bd4e-7712a2b7b29d\",\"4145a8de-975e-4b2f-91e4-c1f5dc52df39\",\"a8fbfc9d-8698-4ab1-8ef0-c42060bc0d9e\"],\"sampling\":1,\"ignoreGlobalFilters\":false,\"incompleteColumns\":{}}}},\"indexpattern\":{\"layers\":{}},\"textBased\":{\"layers\":{}}},\"internalReferences\":[],\"adHocDataViews\":{}},\"references\":[{\"type\":\"index-pattern\",\"id\":\"f1473957-6980-45da-85e0-4305bc9096b4\",\"name\":\"indexpattern-datasource-layer-e6e06fa2-b3df-4f14-a2d7-d71f163a758c\"}]}},\"title\":\"Messages\"}]';

  const references = [
    {
      id: params.dataViewId,
      name: '5feeb5d2-706e-45e4-9d13-f3bb9bcbb2c2:indexpattern-datasource-layer-6879515e-0679-4d58-a106-0be35406f8a3',
      type: 'index-pattern'
    },
    {
      id: params.dataViewId,
      name: '886ec657-aff9-4f8d-85f2-d52ae74e5133:indexpattern-datasource-layer-2406dfc5-4ec4-4829-8df1-c8a29123f68f',
      type: 'index-pattern'
    },
    {
      id: params.dataViewId,
      name: '1e57a1e4-13f3-43a9-a692-81a198a36642:indexpattern-datasource-layer-74b5e9b0-1244-4f22-b4de-acf684fd3120',
      type: 'index-pattern'
    },
    {
      id: params.dataViewId,
      name: '1f6fe6a8-7754-4b1a-8fde-ac7124655427:indexpattern-datasource-layer-e6e06fa2-b3df-4f14-a2d7-d71f163a758c',
      type: 'index-pattern'
    }
  ];

  const attributes = {
    title: params.title,
    description: params.description,
    panelsJSON,
    optionsJSON:
        '{"useMargins":true,"syncColors":false,"syncCursor":true,"syncTooltips":false,"hidePanelTitles":false}',
    version: 1,
    timeRestore: false,
    kibanaSavedObjectMeta: {
      searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}'
    }
  };

  try {
    await kibanaServer.post(
      `/api/saved_objects/dashboard${params.id ? `/${params.id}` : ''}`,
      {
        references,
        attributes
      }
    );
    logger.info(`dashboard ${params.title} created successfully`);
  } catch (error: any) {
    logger.error(`Error creating dashboard ${params.title}`, error);
  }
}

async function deleteDashboard(id: string) {
  try {
    await kibanaServer.delete(`/api/saved_objects/dashboard/${id}`);
    logger.info(`dashboard ${id} deleted successfully`);
  } catch (error: any) {
    logger.error(`Error deleting dashboard ${id}`, error);
  }
}

export {
  createConnectionDashboard,
  deleteDashboard
};
