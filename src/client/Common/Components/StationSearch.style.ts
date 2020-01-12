import { makeStyles } from '@material-ui/styles';

export default makeStyles(theme => ({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  icons: {
    '& > svg': {
      fontSize: '1.3em',
      verticalAlign: 'middle',
    },
    position: 'absolute',
    right: 0,
    cursor: 'pointer',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  paper: {
    background: theme.palette.background.default,
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing(1),
    left: 0,
    right: 0,
  },
  loading: {
    position: 'absolute',
    top: '-1em',
    right: '2em',
    transform: 'scale(.5)',
  },
}));
