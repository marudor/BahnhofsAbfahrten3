import { Abfahrt } from 'types/api/iris';
import Platform from 'Common/Components/Platform';
import React from 'react';
import Times from './Times';
import useStyles from './End.style';

type Props = {
  abfahrt: Abfahrt;
  detail: boolean;
};
const End = ({ abfahrt, detail }: Props) => {
  const classes = useStyles();

  return (
    <div className={classes.main} data-testid="abfahrtEnd">
      <Times abfahrt={abfahrt} detail={detail} />
      <Platform
        real={abfahrt.platform}
        scheduled={abfahrt.scheduledPlatform}
        cancelled={abfahrt.cancelled}
      />
    </div>
  );
};

export default End;
