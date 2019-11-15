import { Abfahrt } from 'types/iris';
import { isBefore } from 'date-fns';
import React from 'react';
import stopPropagation from 'Common/stopPropagation';

interface Props {
  abfahrt: Pick<Abfahrt, 'departure' | 'arrival' | 'currentStation' | 'train'>;
  className?: string;
}

// 30 Minutes in ms
const timeConstraint = 30 * 60 * 1000;

const TravelynxLink = ({ abfahrt, className }: Props) =>
  abfahrt.departure &&
  !abfahrt.departure.cancelled &&
  isBefore(
    abfahrt.arrival
      ? abfahrt.arrival.scheduledTime
      : abfahrt.departure.scheduledTime,
    Date.now() + timeConstraint
  ) ? (
    <a
      data-testid="travellynxlink"
      className={className}
      onClick={stopPropagation}
      rel="noopener noreferrer"
      target="_blank"
      href={`https://travelynx.de/s/${abfahrt.currentStation.id}?train=${abfahrt.train.trainCategory} ${abfahrt.train.number}`}
    >
      travelynx
    </a>
  ) : null;

export default TravelynxLink;
