export default function (call: any): string {
  return call.metadata._internal_repr.access_key_id.toString();
}
