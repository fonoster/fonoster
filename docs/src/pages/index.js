import React from 'react';
import  { Redirect } from 'react-router-dom';
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function Home() {
  return <Redirect to={useBaseUrl('/docs/overview')} />;
}