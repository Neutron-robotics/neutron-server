import axios from 'axios';
import logger from '../../logger';
import kibanaServer from './kibana';
import { KibanaSavedObject } from './types';

async function createDataView(name: string, index: string) {
  try {
    const response = await kibanaServer.post('/api/data_views/data_view', {
      data_view: {
        title: index,
        name
      }
    });
    logger.info(`Data view ${name} created successfuly`);
    return response.data['data_view'].id as string;
  } catch (error: any) {
    logger.error(`Error creating data view ${name}: ${error.response.data}`);
  }
}

async function getDataViewByIndexPattern(index: string): Promise<KibanaSavedObject<any>[] | undefined> {
  try {
    const res = await kibanaServer.get(`/api/saved_objects/_find?type=index-pattern&search_fields=title&search=${index}*`);
    return res.data.saved_objects as KibanaSavedObject<any>[];
  } catch (error) {
    logger.error(`Error getting dataview ${index}`);
  }
}

async function deleteDataViewById(id: string) {
  try {
    await kibanaServer.delete(`/api/data_views/data_view/${id}`);
    logger.info(`data view ${id} deleted successfully`);
  } catch (error: any) {
    logger.error(`Error deleting dataview ${id}: ${error.response.data}`);
  }
}

async function deleteDataViewByIndexPattern(index: string) {
  const dataviews = await getDataViewByIndexPattern(index);
  if (!dataviews) return;
  for (const dataview of dataviews) {
    await deleteDataViewById(dataview.id);
  }
}

export {
  createDataView,
  getDataViewByIndexPattern,
  deleteDataViewById,
  deleteDataViewByIndexPattern
};
