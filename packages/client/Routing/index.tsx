import { Header } from './Components/Header';
import { makeStyles } from '@material-ui/core';
import { renderRoutes } from 'react-router-config';
import { routes } from './routes';
import { RoutingFavProvider } from 'client/Routing/provider/RoutingFavProvider';
import type { FC } from 'react';

const useStyles = makeStyles({
  wrap: {
    display: 'flex',
    flexDirection: 'column',
  },
});

export const Routing: FC = () => {
  const classes = useStyles();
  return (
    <RoutingFavProvider>
      <div className={classes.wrap}>
        <Header />
        {renderRoutes(routes)}
      </div>
    </RoutingFavProvider>
  );
};
// eslint-disable-next-line import/no-default-export
export default Routing;
