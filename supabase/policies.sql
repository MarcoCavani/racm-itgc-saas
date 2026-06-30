-- Users policies
create policy "Users can view their own profile"
  on users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on users for update
  using (auth.uid() = id);

create policy "Public can insert new users (signup)"
  on users for insert
  with check (true);

create policy "Admins can view all users"
  on users for select
  using (
    exists (
      select 1 from users u 
      where u.id = auth.uid() and u.is_admin = true
    )
  );

-- Assessments policies
create policy "Users can view their own assessments"
  on assessments for select
  using (auth.uid() = user_id);

create policy "Users can create assessments"
  on assessments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own assessments"
  on assessments for update
  using (auth.uid() = user_id);

create policy "Users can delete their own assessments"
  on assessments for delete
  using (auth.uid() = user_id);

create policy "Admins can view all assessments"
  on assessments for select
  using (
    exists (
      select 1 from users u 
      where u.id = auth.uid() and u.is_admin = true
    )
  );

-- Templates policies (public library)
create policy "Everyone can view templates"
  on templates for select
  using (true);

create policy "Admins can create templates"
  on templates for insert
  with check (
    exists (
      select 1 from users u 
      where u.id = auth.uid() and u.is_admin = true
    )
  );

create policy "Admins can update templates"
  on templates for update
  using (
    exists (
      select 1 from users u 
      where u.id = auth.uid() and u.is_admin = true
    )
  );

create policy "Admins can delete templates"
  on templates for delete
  using (
    exists (
      select 1 from users u 
      where u.id = auth.uid() and u.is_admin = true
    )
  );

-- Template purchases policies
create policy "Users can view their own purchases"
  on template_purchases for select
  using (auth.uid() = user_id);

create policy "Users can insert purchase records"
  on template_purchases for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all purchases"
  on template_purchases for select
  using (
    exists (
      select 1 from users u 
      where u.id = auth.uid() and u.is_admin = true
    )
  );

-- Subscriptions policies
create policy "Users can view their own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

create policy "Admins can view all subscriptions"
  on subscriptions for select
  using (
    exists (
      select 1 from users u 
      where u.id = auth.uid() and u.is_admin = true
    )
  );

create policy "System can insert/update subscriptions"
  on subscriptions for insert
  with check (true);

create policy "System can update subscriptions"
  on subscriptions for update
  using (true);

-- Payments policies
create policy "Users can view their own payments"
  on payments for select
  using (auth.uid() = user_id);

create policy "Admins can view all payments"
  on payments for select
  using (
    exists (
      select 1 from users u 
      where u.id = auth.uid() and u.is_admin = true
    )
  );

create policy "System can insert payments"
  on payments for insert
  with check (true);
