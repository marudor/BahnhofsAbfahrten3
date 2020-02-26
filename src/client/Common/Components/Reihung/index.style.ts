import { Formation } from 'types/reihung';
import { makeStyles } from '@material-ui/styles';

export default makeStyles(theme => ({
  wrap: {
    overflowX: 'auto',
  },
  position: {
    position: 'absolute',
    bottom: '.5em',
    left: '4em',
  },
  speed: {
    position: 'absolute',
    bottom: '.5em',
    left: '8em',
  },
  plan: {
    position: 'absolute',
    bottom: '1.5em',
  },
  main: ({
    reihung,
    fahrzeugGruppe,
    showUIC,
  }: {
    reihung: Formation | null | undefined;
    fahrzeugGruppe: boolean;
    showUIC: boolean;
  }) => {
    let height = 8;

    if (fahrzeugGruppe) height += 1;
    if (showUIC) height += 1;
    if (reihung) {
      if (reihung.differentZugnummer) height += 1;
      if (reihung.differentDestination) height += 1;
      if (reihung.allFahrzeuggruppe.find(g => g.br && g.br.showBRInfo))
        height += 1;
      if (reihung.allFahrzeuggruppe.some(g => g.name)) {
        height += 1;
      }
    }

    return {
      minWidth: '70em',
      overflow: 'hidden',
      position: 'relative',
      fontSize: '170%',
      marginBottom: '1em',
      marginRight: '.3em',
      height: `${height}em`,
    };
  },
  specificType: {
    position: 'absolute',
    bottom: 0,
    zIndex: 10,
  },
  sektoren: {
    position: 'relative',
  },
  reihung: {
    position: 'relative',
    marginTop: '1.3em',
    height: '100%',
  },
  richtung: ({ reihung }: { reihung: Formation | null | undefined }) => ({
    backgroundColor: theme.palette.text.primary,
    width: '50%',
    height: 2,
    position: 'absolute',
    left: '50%',
    bottom: '.5em',
    zIndex: 10,
    transform:
      reihung && reihung.realFahrtrichtung
        ? 'translateX(-50%)'
        : 'rotate(180deg) translateX(50%)',
    '&::after': {
      border: `solid ${theme.palette.text.primary}`,
      borderWidth: '0 2px 2px 0',
      display: 'inline-block',
      padding: 3,
      content: '""',
      transform: 'rotate(135deg)',
      position: 'absolute',
      top: -3,
    },
  }),
}));
