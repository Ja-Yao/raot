import { badgeStyles } from '../styles';

export interface BadgeProps extends React.ComponentProps<'span'> {
  intent?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'outline';
  isCircle?: boolean;
}

export function Badge({ intent, isCircle, className, ...props }: BadgeProps) {
  return <span {...props} className={badgeStyles({ intent, isCircle, className })} />;
}
