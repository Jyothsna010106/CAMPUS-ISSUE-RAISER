import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import API from '../services/api';

export default function SectionsPage() {
  const [sections, setSections] = useState([]);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    Promise.all([API.get('/sections'), API.get('/issues')])
      .then(([sectionsRes, issuesRes]) => {
        const sectionList = sectionsRes.data;
        const issueList = issuesRes.data;
        const sectionCounts = issueList.reduce((acc, issue) => {
          acc[issue.sectionId] = (acc[issue.sectionId] || 0) + 1;
          return acc;
        }, {});

        setSections(sectionList);
        setCounts(sectionCounts);
      })
      .catch(() => {
        setSections([]);
      });
  }, []);

  return (
    <AppLayout title="Section View">
      <div className="grid two">
        {sections.map((section) => (
          <div className="panel" key={section._id}>
            <h3>{section.name}</h3>
            <p>Issues: {counts[section._id] || 0}</p>
            <p>Sub-sections: {section.subSections?.length ? section.subSections.join(', ') : 'None'}</p>
            <Link className="btn" to={`/issues?sectionId=${section._id}`}>View Issues</Link>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
