import { makeStyles } from '@material-ui/styles';

export default makeStyles((theme) => ({
  time: {
    alignItems: 'flex-end',
  },
  wrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
    '& > span': {
      color: theme.palette.text.primary,
      whiteSpace: 'pre-wrap',
    },
  },
  cancelled: theme.mixins.cancelled,
}));
