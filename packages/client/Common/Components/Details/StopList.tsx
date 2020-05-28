import { useContext, useEffect, useMemo } from 'react';
import cc from 'clsx';
import DetailsContext from './DetailsContext';
import Error from '@material-ui/icons/Error';
import Loading from '../Loading';
import Stop from 'client/Common/Components/Details/Stop';
import useStyles from './StopList.style';
import type { ResponseError } from 'umi-request';

function getErrorText(error: ResponseError) {
  if (error.type === 'Timeout') return 'Timeout, bitte neuladen.';
  if (error.response) {
    if (error.response.status === 404) {
      return 'Unbekannter Zug';
    }
  }

  return 'Unbekannter Fehler';
}

const StopList = () => {
  const { details, error } = useContext(DetailsContext);
  const classes = useStyles();

  useEffect(() => {
    if (details && details.currentStop) {
      const scrollDom = document.getElementById(details.currentStop.station.id);

      if (scrollDom) {
        scrollDom.scrollIntoView();
      }
    }
  }, [details]);

  const detailsStops = useMemo(() => {
    if (!details) return null;
    let hadCurrent = false;

    return details.stops.map((s) => {
      if (details.currentStop?.station.id === s.station.id) {
        hadCurrent = true;
      }

      return (
        <Stop
          isPast={!hadCurrent}
          train={details.train}
          stop={s}
          key={s.station.id}
          showWR={
            details.currentStop?.station.id === s.station.id
              ? details.train
              : undefined
          }
        />
      );
    });
  }, [details]);

  if (error) {
    return (
      <main className={cc(classes.wrap, classes.error)}>
        <Error data-testid="error" className={classes.error} />{' '}
        {getErrorText(error)}
      </main>
    );
  }

  if (!details) {
    return <Loading />;
  }

  return (
    <main className={classes.wrap}>
      {/* <Messages messages={details.messages} /> */}
      {detailsStops}
    </main>
  );
};

export default StopList;
