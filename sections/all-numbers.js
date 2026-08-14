// Страница «Все номера» — реестр телефонов по образцу gov.uz. Данные сотрудников
// НЕ хардкодятся: строится из того же /api/team, что и window.renderTeam
// (см. sections/team.js) — правишь номер один раз в «Команде», здесь он
// подхватывается автоматически. Общие номера (Приёмная/Канцелярия/Телефон
// доверия) в схеме team.json отсутствуют — статичный плейсхолдер «уточняется».

// Общий номер учреждения (data/contact.json → phones[0], «Для справок»).
// Если он по ошибке проставлен как личный номер сотрудника в team.json,
// в реестре «Все номера» такой номер не показываем — дублирование, а не
// личный контакт (см. personalPhone ниже).
const GENERAL_INSTITUTION_PHONE = '+998997494304';

function personalPhone(phone) {
    return (phone && phone !== GENERAL_INSTITUTION_PHONE) ? phone : '';
}

function numbersContactCell(phone, email) {
    const esc = window.escapeHtml;
    const parts = [];
    if (phone) parts.push(`<a href="tel:${esc(phone)}">${esc(phone)}</a>`);
    if (email) parts.push(`<a href="mailto:${esc(email)}" class="numbers-email">${esc(email)}</a>`);
    return parts.length ? parts.join('<br>') : window.t('contact.tbd');
}

function numbersPersonCell(name, role) {
    const esc = window.escapeHtml;
    return `${esc(name)}${role ? `<span class="numbers-role">${esc(role)}</span>` : ''}`;
}

function numbersRow(contactHtml, personHtml) {
    return `<tr><td>${contactHtml}</td><td>${personHtml}</td></tr>`;
}

function numbersGroupRow(label) {
    return `<tr class="numbers-group-row"><td colspan="2">${window.escapeHtml(label)}</td></tr>`;
}

window.renderAllNumbers = function (data) {
    const td  = window.tData;
    const tbd = window.t('contact.tbd');

    // TODO: вписать реальные номера/почту приёмной, канцелярии и телефона доверия
    const generalRows = [
        window.t('allNumbersPage.reception'),
        window.t('allNumbersPage.office'),
        window.t('contactsPage.hotline'),
    ].map(label => numbersRow(tbd, numbersPersonCell(label, ''))).join('');

    const director = data.director;
    const directorRows = director
        ? numbersRow(numbersContactCell(personalPhone(director.phone), director.email), numbersPersonCell(director.name, td(director.title)))
        : '';

    const deputyRows = (data.deputies || []).map(d =>
        numbersRow(numbersContactCell(personalPhone(d.phone), d.email), numbersPersonCell(d.name, `${td(d.role)} — ${td(d.department)}`))
    ).join('');

    const staffRows = (data.staff || []).map(s =>
        numbersRow(numbersContactCell(personalPhone(s.phone), s.email), numbersPersonCell(s.name, td(s.role)))
    ).join('');

    return `
<section class="section" id="all-numbers-page">
    <div class="section-block">
        <h1 class="section-title">${window.t('contact.nav.allNumbers')}</h1>
        <p class="section-subtitle">${window.t('allNumbersPage.subtitle')}</p>
    </div>

    <div class="contacts-table-wrap">
        <table class="contacts-table numbers-table">
            <thead>
                <tr>
                    <th>${window.t('allNumbersPage.colContact')}</th>
                    <th>${window.t('allNumbersPage.colPerson')}</th>
                </tr>
            </thead>
            <tbody>
                ${numbersGroupRow(window.t('allNumbersPage.groupGeneral'))}
                ${generalRows}
                ${director ? numbersGroupRow(window.t('team.nav.director')) + directorRows : ''}
                ${deputyRows ? numbersGroupRow(window.t('team.nav.deputies')) + deputyRows : ''}
                ${staffRows ? numbersGroupRow(window.t('team.nav.staff')) + staffRows : ''}
            </tbody>
        </table>
    </div>
</section>`;
};
