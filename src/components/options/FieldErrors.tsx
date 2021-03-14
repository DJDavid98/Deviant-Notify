import { VFC } from '../../common-types.js';
import { h } from '../../vendor/preact.js';

interface PropTypes {
  errors: Record<string, string[]>;
  field: string;
}

export const FieldErrors: VFC<PropTypes> = ({ errors, field }) => (
  Array.isArray(errors[field]) && <ul className="error">
    {errors[field].map((el, i) => <li key={i}>{el}</li>)}
  </ul>
);
