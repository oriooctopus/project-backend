import moment from 'moment';

export const timestampToDate = (timestamp: number) => {
  console.log('timtesatmp', timestamp);
  return moment(timestamp).format('MM/DD/YY HH:mm');
}

export const isAdmin = (context: any) => {
  return context.req.identity.role === 'admin';
};
