import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import API from '../services/api';

export default function CreateIssuePage() {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [taggableUsers, setTaggableUsers] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    sectionId: '',
    tagsInput: '',
    taggedAuthorityIds: [],
    imageUrl: '',
    imageName: '',
    isAnonymous: false,
  });

  const draftImpactScore = useMemo(() => {
    const titleWeight = form.title.trim().length > 12 ? 30 : form.title.trim().length > 0 ? 15 : 0;
    const descriptionWeight = form.description.trim().length > 80 ? 35 : form.description.trim().length > 0 ? 15 : 0;
    const tagsWeight = form.tagsInput.split(',').map((item) => item.trim()).filter(Boolean).length > 1 ? 15 : 5;
    const authorityWeight = form.taggedAuthorityIds.length > 0 ? 12 : 0;
    const evidenceWeight = form.imageUrl ? 8 : 0;
    return Math.min(100, titleWeight + descriptionWeight + tagsWeight + authorityWeight + evidenceWeight);
  }, [form.title, form.description, form.tagsInput, form.taggedAuthorityIds.length, form.imageUrl]);

  useEffect(() => {
    Promise.all([API.get('/sections'), API.get('/users/taggable')])
      .then(([sectionsRes, taggableRes]) => {
        setSections(sectionsRes.data);
        setTaggableUsers(taggableRes.data);
        if (sectionsRes.data[0]) {
          setForm((prev) => ({ ...prev, sectionId: sectionsRes.data[0]._id }));
        }
      })
      .catch(() => setError('Unable to load form data'));
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const tags = form.tagsInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      await API.post('/issues', {
        title: form.title,
        description: form.description,
        sectionId: form.sectionId,
        tags,
        taggedAuthorityIds: form.taggedAuthorityIds,
        imageUrl: form.imageUrl,
        isAnonymous: form.isAnonymous,
      });

      navigate('/home');
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to create issue');
    }
  };

  const onImageSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    const toDataUrl = () => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    try {
      const dataUrl = await toDataUrl();
      setForm((prev) => ({ ...prev, imageUrl: String(dataUrl), imageName: file.name }));
    } catch {
      setError('Unable to process selected image');
    }
  };

  return (
    <AppLayout title="Create Issue">
      <form className="panel create-flow" onSubmit={onSubmit}>
        <div className="create-flow-head">
          <h3>Report a campus issue in 3 quick steps</h3>
          <p className="hint">Clear details = faster resolution.</p>
        </div>

        <div className="create-highlight">
          <div>
            <span className="hint">Draft quality</span>
            <strong>{draftImpactScore}%</strong>
          </div>
          <p className="hint">High quality reports with context and evidence are solved faster.</p>
        </div>

        <div className="create-step">
          <span className="step-badge">1</span>
          <div>
            <strong>Describe the problem</strong>
            <p className="hint">Be specific about what, where, and impact.</p>
          </div>
        </div>
        <label>Title</label>
        <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} required />

        <label>Description</label>
        <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} required />

        <label>Section</label>
        <select value={form.sectionId} onChange={(event) => setForm((prev) => ({ ...prev, sectionId: event.target.value }))} required>
          {sections.map((section) => (
            <option key={section._id} value={section._id}>{section.name}</option>
          ))}
        </select>

        <div className="create-step">
          <span className="step-badge">2</span>
          <div>
            <strong>Add context</strong>
            <p className="hint">Tags, image, and anonymous mode are optional but helpful.</p>
          </div>
        </div>

        <div className="create-inspo-row">
          {['Where exactly?', 'When did it start?', 'How many students affected?'].map((tip) => (
            <span key={tip} className="chip subtle">{tip}</span>
          ))}
        </div>

        <label>Tags (comma separated)</label>
        <input value={form.tagsInput} onChange={(event) => setForm((prev) => ({ ...prev, tagsInput: event.target.value }))} placeholder="wifi, attendance" />

        <label>Issue Image (optional)</label>
        <div className="create-media-shell">
          <label className="create-media-picker">
            <input type="file" accept="image/*" onChange={onImageSelect} />
            <span>{form.imageUrl ? 'Replace image' : 'Add image'}</span>
          </label>
          {form.imageUrl && (
            <div className="upload-preview create-media-preview">
              <img src={form.imageUrl} alt="Issue preview" className="issue-image" />
              <p className="hint">{form.imageName}</p>
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setForm((prev) => ({ ...prev, imageUrl: '', imageName: '' }))}
              >
                Remove image
              </button>
            </div>
          )}
          {!form.imageUrl && (
            <p className="hint">Tip: image proof usually increases trust and faster resolution.</p>
          )}
        </div>

        <label className="anonymous-toggle">
          <input
            type="checkbox"
            checked={form.isAnonymous}
            onChange={(event) => setForm((prev) => ({ ...prev, isAnonymous: event.target.checked }))}
          />
          <span>Post this issue anonymously for safety</span>
        </label>

        {form.isAnonymous && <p className="hint create-anon-note">Your identity is hidden from other users and visible only to admins for safety governance.</p>}

        <div className="create-step">
          <span className="step-badge">3</span>
          <div>
            <strong>Tag responsible authorities</strong>
            <p className="hint">Tagged people receive in-app notifications.</p>
          </div>
        </div>

        <label>Tag Authorities (optional)</label>
        <div className="tags-wrap">
          {taggableUsers.map((user) => {
            const selected = form.taggedAuthorityIds.includes(user._id);
            return (
              <button
                type="button"
                key={user._id}
                className={`chip ${selected ? '' : 'subtle'}`}
                onClick={() => setForm((prev) => ({
                  ...prev,
                  taggedAuthorityIds: selected
                    ? prev.taggedAuthorityIds.filter((id) => id !== user._id)
                    : [...prev.taggedAuthorityIds, user._id],
                }))}
              >
                {user.name} ({user.role})
              </button>
            );
          })}
        </div>

        {error && <small className="error">{error}</small>}
        <div className="create-submit-row">
          <p className="hint">Ready to publish this as a community-impact issue?</p>
          <button className="btn" type="submit">Submit & Start Resolution</button>
        </div>
      </form>
    </AppLayout>
  );
}
