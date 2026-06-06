-- Safe pre-auth preview for the invite claim flow (no PII beyond display names).
CREATE OR REPLACE FUNCTION public.peek_invite_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_node nodes%ROWTYPE;
  v_tree family_trees%ROWTYPE;
  v_inviter text;
  v_relationship text;
BEGIN
  SELECT * INTO v_node
  FROM nodes
  WHERE upper(trim(invite_code)) = upper(trim(p_code))
    AND invite_code IS NOT NULL
    AND deleted_at IS NULL
    AND status NOT IN ('deleted', 'archived', 'vacated')
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  IF v_node.owner_account_id IS NOT NULL OR v_node.status = 'claimed' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'ALREADY_CLAIMED');
  END IF;

  SELECT * INTO v_tree FROM family_trees WHERE id = v_node.family_tree_id;

  SELECT coalesce(a.display_name, 'Someone in your family')
  INTO v_inviter
  FROM tree_memberships m
  JOIN accounts a ON a.id = m.account_id
  WHERE m.family_tree_id = v_node.family_tree_id
    AND m.role IN ('owner', 'creator')
  ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'creator' THEN 1 ELSE 2 END
  LIMIT 1;

  SELECT r.relationship_type INTO v_relationship
  FROM relationships r
  WHERE (r.to_node_id = v_node.id OR r.from_node_id = v_node.id)
    AND r.status = 'approved'
  ORDER BY r.created_at
  LIMIT 1;

  RETURN jsonb_build_object(
    'valid', true,
    'display_name', v_node.display_name,
    'inviter_name', coalesce(v_inviter, 'Someone in your family'),
    'tree_name', coalesce(v_tree.name, 'Family Tree'),
    'requires_password', (v_node.claim_password IS NOT NULL AND length(trim(v_node.claim_password)) > 0),
    'relationship_type', v_relationship
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.peek_invite_code(text) TO anon, authenticated;
